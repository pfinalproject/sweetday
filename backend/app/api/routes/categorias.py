from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.categoria import Categoria
from app.models.usuario import RolUsuario
from app.schemas.categoria import CategoriaCrear, CategoriaSalida

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


@router.get("", response_model=list[CategoriaSalida], dependencies=[Depends(get_usuario_actual)])
def listar(activo: bool = True, db: Session = Depends(get_db)):
    return db.query(Categoria).filter(Categoria.activo.is_(activo)).order_by(Categoria.nombre).all()


@router.post(
    "",
    response_model=CategoriaSalida,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def crear(datos: CategoriaCrear, db: Session = Depends(get_db)):
    categoria = Categoria(nombre=datos.nombre)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.put(
    "/{categoria_id}",
    response_model=CategoriaSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def actualizar(categoria_id: str, datos: CategoriaCrear, db: Session = Depends(get_db)):
    categoria = db.get(Categoria, categoria_id)
    if categoria is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada")

    categoria.nombre = datos.nombre
    db.commit()
    db.refresh(categoria)
    return categoria


@router.patch(
    "/{categoria_id}/estado",
    response_model=CategoriaSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def cambiar_estado(categoria_id: str, activo: bool, db: Session = Depends(get_db)):
    categoria = db.get(Categoria, categoria_id)
    if categoria is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada")

    categoria.activo = activo
    db.commit()
    db.refresh(categoria)
    return categoria
