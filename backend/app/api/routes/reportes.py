from datetime import date, datetime, time, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import requiere_rol
from app.db.session import get_db
from app.models.compra import Compra
from app.models.usuario import RolUsuario
from app.models.venta import Venta
from app.schemas.reporte import ResumenFinanciero

router = APIRouter(
    prefix="/api/reportes",
    tags=["reportes"],
    dependencies=[Depends(requiere_rol(RolUsuario.DUENA))],
)


@router.get("/resumen", response_model=ResumenFinanciero)
def resumen(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)):
    desde_dt = datetime.combine(desde, time.min, tzinfo=timezone.utc) if desde else None
    hasta_dt = datetime.combine(hasta, time.max, tzinfo=timezone.utc) if hasta else None

    ventas_q = db.query(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id))
    compras_q = db.query(func.coalesce(func.sum(Compra.total), 0), func.count(Compra.id))

    if desde_dt is not None:
        ventas_q = ventas_q.filter(Venta.creado_en >= desde_dt)
        compras_q = compras_q.filter(Compra.creado_en >= desde_dt)
    if hasta_dt is not None:
        ventas_q = ventas_q.filter(Venta.creado_en <= hasta_dt)
        compras_q = compras_q.filter(Compra.creado_en <= hasta_dt)

    ingresos, num_ventas = ventas_q.one()
    egresos, num_compras = compras_q.one()
    ingresos = Decimal(ingresos)
    egresos = Decimal(egresos)

    return ResumenFinanciero(
        ingresos=ingresos,
        egresos=egresos,
        ganancia_neta=ingresos - egresos,
        num_ventas=num_ventas,
        num_compras=num_compras,
    )
