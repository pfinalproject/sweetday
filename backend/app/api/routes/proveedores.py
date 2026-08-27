from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.proveedor import Proveedor
from app.models.usuario import RolUsuario
from app.schemas.proveedor import ProveedorCrear, ProveedorSalida

router = APIRouter(prefix="/api/proveedores", tags=["proveedores"])


@router.get("", response_model=list[ProveedorSalida], dependencies=[Depends(get_usuario_actual)])
def listar(activo: bool = True, db: Session = Depends(get_db)):
    return db.query(Proveedor).filter(Proveedor.activo.is_(activo)).order_by(Proveedor.nombre).all()


@router.post(
    "",
    response_model=ProveedorSalida,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def crear(datos: ProveedorCrear, db: Session = Depends(get_db)):
    proveedor = Proveedor(**datos.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.put(
    "/{proveedor_id}",
    response_model=ProveedorSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def actualizar(proveedor_id: str, datos: ProveedorCrear, db: Session = Depends(get_db)):
    proveedor = db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    for campo, valor in datos.model_dump().items():
        setattr(proveedor, campo, valor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.patch(
    "/{proveedor_id}/estado",
    response_model=ProveedorSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def cambiar_estado(proveedor_id: str, activo: bool, db: Session = Depends(get_db)):
    proveedor = db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    proveedor.activo = activo
    db.commit()
    db.refresh(proveedor)
    return proveedor
