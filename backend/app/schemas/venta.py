import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VentaItemCrear(BaseModel):
    producto_id: uuid.UUID
    cantidad: int = Field(gt=0)


class VentaCrear(BaseModel):
    items: list[VentaItemCrear] = Field(min_length=1)


class VentaDetalleSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_id: uuid.UUID
    nombre_producto: str
    cantidad: int
    precio_unitario: Decimal
    costo_unitario: Decimal


class VentaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usuario_id: uuid.UUID
    usuario_nombre: str
    total: Decimal
    creado_en: datetime
    anulada: bool
    anulada_en: datetime | None
    detalles: list[VentaDetalleSalida]
