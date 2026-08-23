from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.compra import Compra
from app.models.producto import Producto
from app.models.usuario import RolUsuario, Usuario
from app.schemas.compra import CompraCrear, CompraSalida

router = APIRouter(
    prefix="/api/compras",
    tags=["compras"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)


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
