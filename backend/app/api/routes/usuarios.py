from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_rol
from app.core.security import hash_password
from app.db.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.usuario import UsuarioCrear, UsuarioSalida

router = APIRouter(
    prefix="/api/usuarios",
    tags=["usuarios"],
    dependencies=[Depends(requiere_rol(RolUsuario.DUENA))],
)


@router.get("", response_model=list[UsuarioSalida])
def listar(db: Session = Depends(get_db)):
    return db.query(Usuario).order_by(Usuario.nombre).all()


@router.post("", response_model=UsuarioSalida, status_code=201)
def crear(datos: UsuarioCrear, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == datos.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese email")

    usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        hash_password=hash_password(datos.password),
        rol=datos.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}/estado", response_model=UsuarioSalida)
def cambiar_estado(usuario_id: str, activo: bool, db: Session = Depends(get_db)):
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    usuario.activo = activo
    db.commit()
    db.refresh(usuario)
    return usuario
