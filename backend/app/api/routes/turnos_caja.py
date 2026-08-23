from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.turno_caja import TurnoCaja
from app.models.usuario import RolUsuario, Usuario
from app.schemas.caja import TurnoCajaAbrir, TurnoCajaCerrar, TurnoCajaSalida

router = APIRouter(prefix="/api/turnos-caja", tags=["turnos-caja"])


def _turno_abierto(db: Session) -> TurnoCaja | None:
    return db.query(TurnoCaja).filter(TurnoCaja.cierre_fecha.is_(None)).first()


@router.get("/actual", response_model=TurnoCajaSalida | None, dependencies=[Depends(get_usuario_actual)])
def actual(db: Session = Depends(get_db)):
    """Cualquier rol puede consultarlo: la Empleada necesita saber si puede vender."""
    return _turno_abierto(db)


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
