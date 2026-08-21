from decimal import Decimal

from pydantic import BaseModel


class ResumenFinanciero(BaseModel):
    ingresos: Decimal
    egresos: Decimal
    ganancia_neta: Decimal
    num_ventas: int
    num_compras: int
