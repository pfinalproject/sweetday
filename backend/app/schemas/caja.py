import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TurnoCajaAbrir(BaseModel):
    monto_apertura: Decimal = Field(ge=0)


class TurnoCajaCerrar(BaseModel):
    monto_cierre: Decimal = Field(ge=0)


class TurnoCajaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usuario_id: uuid.UUID
    apertura_fecha: datetime
    monto_apertura: Decimal
    cierre_fecha: datetime | None
    monto_cierre: Decimal | None
    total_vendido: Decimal | None = None


class TurnoCajaHistorial(BaseModel):
    id: uuid.UUID
    nombre_usuario: str
    apertura_fecha: datetime
    monto_apertura: Decimal
    cierre_fecha: datetime | None
    monto_cierre: Decimal | None
