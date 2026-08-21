from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ResumenFinanciero(BaseModel):
    ingresos: Decimal
    egresos: Decimal
    ganancia_neta: Decimal
    num_ventas: int
    num_compras: int


class ProductoTendencia(BaseModel):
    producto_id: UUID
    nombre: str
    unidades_semana_actual: int
    unidades_semana_anterior: int
    variacion_pct: float | None
