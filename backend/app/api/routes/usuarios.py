from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_rol
from app.core.security import hash_password
from app.db.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.usuario import UsuarioActualizar, UsuarioCrear, UsuarioSalida

router = APIRouter(
    prefix="/api/usuarios",
    tags=["usuarios"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
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


@router.put("/{usuario_id}", response_model=UsuarioSalida)
def actualizar(usuario_id: str, datos: UsuarioActualizar, db: Session = Depends(get_db)):
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    cambios = datos.model_dump(exclude_unset=True, exclude_none=True)
    nuevo_email = cambios.pop("email", None)
    if nuevo_email is not None and nuevo_email != usuario.email:
        if db.query(Usuario).filter(Usuario.email == nuevo_email, Usuario.id != usuario.id).first() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese email")
        usuario.email = nuevo_email

    password = cambios.pop("password", None)
    if password is not None:
        usuario.hash_password = hash_password(password)

    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)

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
