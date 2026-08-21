from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.producto import Producto
from app.models.usuario import RolUsuario
from app.schemas.producto import ProductoCrear, ProductoSalida

router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.get("", response_model=list[ProductoSalida], dependencies=[Depends(get_usuario_actual)])
def listar(activo: bool = True, db: Session = Depends(get_db)):
    return (
        db.query(Producto)
        .options(joinedload(Producto.categoria), joinedload(Producto.proveedor))
        .filter(Producto.activo.is_(activo))
        .order_by(Producto.nombre)
        .all()
    )


@router.get(
    "/codigo/{codigo_barras}",
    response_model=ProductoSalida,
    dependencies=[Depends(get_usuario_actual)],
)
def buscar_por_codigo(codigo_barras: str, db: Session = Depends(get_db)):
    """Usado por el escaner de la app (ZXing) al detectar un codigo de barras."""
    producto = (
        db.query(Producto)
        .options(joinedload(Producto.categoria), joinedload(Producto.proveedor))
        .filter(Producto.codigo_barras == codigo_barras)
        .first()
    )
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


@router.post(
    "",
    response_model=ProductoSalida,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolUsuario.DUENA))],
)
def crear(datos: ProductoCrear, db: Session = Depends(get_db)):
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put(
    "/{producto_id}",
    response_model=ProductoSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.DUENA))],
)
def actualizar(producto_id: str, datos: ProductoCrear, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for campo, valor in datos.model_dump().items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requiere_rol(RolUsuario.DUENA))],
)
def desactivar(producto_id: str, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    producto.activo = False
    db.commit()
