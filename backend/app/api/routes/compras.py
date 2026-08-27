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
