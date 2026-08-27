from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.compra import Compra
from app.models.producto import Producto
from app.models.usuario import RolUsuario, Usuario
from app.schemas.compra import CompraCrear, CompraHistorial, CompraSalida

router = APIRouter(
    prefix="/api/compras",
    tags=["compras"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)


@router.get("", response_model=list[CompraHistorial])
def listar(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)):
    query = db.query(Compra).options(
        joinedload(Compra.producto),
        joinedload(Compra.proveedor),
        joinedload(Compra.usuario),
    )
    if desde is not None:
        query = query.filter(Compra.creado_en >= datetime.combine(desde, time.min, tzinfo=timezone.utc))
    if hasta is not None:
        query = query.filter(Compra.creado_en <= datetime.combine(hasta, time.max, tzinfo=timezone.utc))

    compras = query.order_by(Compra.creado_en.desc()).all()
    return [
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
    ]


@router.post("", response_model=CompraSalida, status_code=201)
def crear(
    datos: CompraCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_actual),
):
    """Registra el reabastecimiento de un producto: suma stock y queda como egreso."""
    producto = db.get(Producto, datos.producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    total = datos.costo_unitario * datos.cantidad
    compra = Compra(
        producto_id=producto.id,
        proveedor_id=producto.proveedor_id,
        usuario_id=usuario.id,
        cantidad=datos.cantidad,
        costo_unitario=datos.costo_unitario,
        total=total,
    )
    producto.stock += datos.cantidad
    producto.costo = datos.costo_unitario

    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra


@router.patch("/{compra_id}/anular", response_model=CompraHistorial)
def anular(compra_id: str, db: Session = Depends(get_db)):
    """Revierte el stock que sumó esta compra. No revierte el costo del producto
    (no se guarda el costo anterior), solo el stock."""
    compra = (
        db.query(Compra)
        .options(joinedload(Compra.producto), joinedload(Compra.proveedor), joinedload(Compra.usuario))
        .filter(Compra.id == compra_id)
        .first()
    )
    if compra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")
    if compra.anulada:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta compra ya está anulada")
    if compra.producto.stock < compra.cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No se puede anular: quedan {compra.producto.stock} unidades de "
                f"'{compra.producto.nombre}', menos de las {compra.cantidad} que repuso esta compra"
            ),
        )

    compra.producto.stock -= compra.cantidad
    compra.anulada = True
    compra.anulada_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(compra)
    return CompraHistorial(
        id=compra.id,
        nombre_producto=compra.producto.nombre,
        nombre_proveedor=compra.proveedor.nombre,
        nombre_usuario=compra.usuario.nombre,
        cantidad=compra.cantidad,
        costo_unitario=compra.costo_unitario,
        total=compra.total,
        creado_en=compra.creado_en,
        anulada=compra.anulada,
        anulada_en=compra.anulada_en,
    )
