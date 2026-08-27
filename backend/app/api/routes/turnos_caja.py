from datetime import date, datetime, time, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.api.routes.ventas import _a_salida
from app.db.session import get_db
from app.models.compra import Compra
from app.models.turno_caja import TurnoCaja
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import Venta, VentaDetalle
from app.schemas.caja import TurnoCajaAbrir, TurnoCajaCerrar, TurnoCajaDetalle, TurnoCajaHistorial, TurnoCajaSalida
from app.schemas.compra import CompraHistorial

router = APIRouter(prefix="/api/turnos-caja", tags=["turnos-caja"])


def _turno_abierto(db: Session) -> TurnoCaja | None:
    return db.query(TurnoCaja).filter(TurnoCaja.cierre_fecha.is_(None)).first()


def _total_vendido(db: Session, turno: TurnoCaja) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.creado_en >= turno.apertura_fecha, Venta.anulada.is_(False), Venta.devuelta.is_(False))
        .scalar()
    )
    return Decimal(total)


@router.get("/actual", response_model=TurnoCajaSalida | None, dependencies=[Depends(get_usuario_actual)])
def actual(db: Session = Depends(get_db)):
    """Cualquier rol puede consultarlo: la Empleada necesita saber si puede vender."""
    turno = _turno_abierto(db)
    if turno is None:
        return None
    salida = TurnoCajaSalida.model_validate(turno)
    salida.total_vendido = _total_vendido(db, turno)
    return salida


@router.get(
    "",
    response_model=list[TurnoCajaHistorial],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def listar(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)):
    query = db.query(TurnoCaja).options(joinedload(TurnoCaja.usuario))
    if desde is not None:
        query = query.filter(TurnoCaja.apertura_fecha >= datetime.combine(desde, time.min, tzinfo=timezone.utc))
    if hasta is not None:
        query = query.filter(TurnoCaja.apertura_fecha <= datetime.combine(hasta, time.max, tzinfo=timezone.utc))

    turnos = query.order_by(TurnoCaja.apertura_fecha.desc()).all()
    return [
        TurnoCajaHistorial(
            id=t.id,
            nombre_usuario=t.usuario.nombre,
            apertura_fecha=t.apertura_fecha,
            monto_apertura=t.monto_apertura,
            cierre_fecha=t.cierre_fecha,
            monto_cierre=t.monto_cierre,
        )
        for t in turnos
    ]


@router.get(
    "/{turno_id}/detalle",
    response_model=TurnoCajaDetalle,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def detalle(turno_id: str, db: Session = Depends(get_db)):
    """Ingresos (ventas) y egresos (compras) del turno, desde que se abrió hasta que se
    cerró (o hasta ahora, si sigue abierto)."""
    turno = db.get(TurnoCaja, turno_id)
    if turno is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")

    hasta = turno.cierre_fecha or datetime.now(timezone.utc)

    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.usuario), joinedload(Venta.detalles).joinedload(VentaDetalle.producto))
        .filter(Venta.creado_en >= turno.apertura_fecha, Venta.creado_en <= hasta)
        .order_by(Venta.creado_en)
        .all()
    )
    compras = (
        db.query(Compra)
        .options(joinedload(Compra.producto), joinedload(Compra.proveedor), joinedload(Compra.usuario))
        .filter(Compra.creado_en >= turno.apertura_fecha, Compra.creado_en <= hasta)
        .order_by(Compra.creado_en)
        .all()
    )

    total_ingresos = sum((v.total for v in ventas if not v.anulada and not v.devuelta), Decimal("0"))
    total_egresos = sum((c.total for c in compras if not c.anulada), Decimal("0"))

    return TurnoCajaDetalle(
        turno=TurnoCajaHistorial(
            id=turno.id,
            nombre_usuario=turno.usuario.nombre,
            apertura_fecha=turno.apertura_fecha,
            monto_apertura=turno.monto_apertura,
            cierre_fecha=turno.cierre_fecha,
            monto_cierre=turno.monto_cierre,
        ),
        ventas=[_a_salida(v) for v in ventas],
        compras=[
            CompraHistorial(
                id=c.id,
                nombre_producto=c.producto.nombre,
                nombre_proveedor=c.proveedor.nombre,
                nombre_usuario=c.usuario.nombre,
                cantidad=c.cantidad,
                costo_unitario=c.costo_unitario,
                total=c.total,
                creado_en=c.creado_en,
                anulada=c.anulada,
                anulada_en=c.anulada_en,
            )
            for c in compras
        ],
        total_ingresos=total_ingresos,
        total_egresos=total_egresos,
        ganancia_neta=total_ingresos - total_egresos,
    )


@router.post(
    "/abrir",
    response_model=TurnoCajaSalida,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def abrir(datos: TurnoCajaAbrir, db: Session = Depends(get_db), usuario: Usuario = Depends(get_usuario_actual)):
    if _turno_abierto(db) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya hay una caja abierta")

    turno = TurnoCaja(usuario_id=usuario.id, monto_apertura=datos.monto_apertura)
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return turno


@router.post(
    "/{turno_id}/cerrar",
    response_model=TurnoCajaSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def cerrar(turno_id: str, datos: TurnoCajaCerrar, db: Session = Depends(get_db)):
    turno = db.get(TurnoCaja, turno_id)
    if turno is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    if turno.cierre_fecha is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese turno ya esta cerrado")

    turno.cierre_fecha = datetime.now(timezone.utc)
    turno.monto_cierre = datos.monto_cierre
    db.commit()
    db.refresh(turno)
    return turno
