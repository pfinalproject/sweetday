import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class TurnoCajaAbrir(BaseModel):
    monto_apertura: Decimal


class TurnoCajaCerrar(BaseModel):
    monto_cierre: Decimal


class TurnoCajaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usuario_id: uuid.UUID
    apertura_fecha: datetime
    monto_apertura: Decimal
    cierre_fecha: datetime | None
    monto_cierre: Decimal | None
