from datetime import date, datetime, time, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.turno_caja import TurnoCaja
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import Venta
from app.schemas.caja import TurnoCajaAbrir, TurnoCajaCerrar, TurnoCajaHistorial, TurnoCajaSalida

router = APIRouter(prefix="/api/turnos-caja", tags=["turnos-caja"])


def _turno_abierto(db: Session) -> TurnoCaja | None:
    return db.query(TurnoCaja).filter(TurnoCaja.cierre_fecha.is_(None)).first()


def _total_vendido(db: Session, turno: TurnoCaja) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.creado_en >= turno.apertura_fecha, Venta.anulada.is_(False))
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
