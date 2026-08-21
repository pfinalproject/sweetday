import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CompraCrear(BaseModel):
    producto_id: uuid.UUID
    cantidad: int = Field(gt=0)
    costo_unitario: Decimal


class CompraSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    producto_id: uuid.UUID
    proveedor_id: uuid.UUID
    usuario_id: uuid.UUID
    cantidad: int
    costo_unitario: Decimal
    total: Decimal
    creado_en: datetime
