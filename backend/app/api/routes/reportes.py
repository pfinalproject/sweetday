from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import requiere_rol
from app.db.session import get_db
from app.models.compra import Compra
from app.models.producto import Producto
from app.models.usuario import RolUsuario
from app.models.venta import Venta, VentaDetalle
from app.schemas.reporte import ProductoTendencia, ResumenFinanciero

router = APIRouter(
    prefix="/api/reportes",
    tags=["reportes"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)


@router.get("/resumen", response_model=ResumenFinanciero)
def resumen(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)):
    desde_dt = datetime.combine(desde, time.min, tzinfo=timezone.utc) if desde else None
    hasta_dt = datetime.combine(hasta, time.max, tzinfo=timezone.utc) if hasta else None

    ventas_q = db.query(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id)).filter(
        Venta.anulada.is_(False), Venta.devuelta.is_(False)
    )
    compras_q = db.query(func.coalesce(func.sum(Compra.total), 0), func.count(Compra.id)).filter(
        Compra.anulada.is_(False)
    )

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


def _unidades_vendidas_por_producto(db: Session, desde: datetime, hasta: datetime) -> dict[str, int]:
    filas = (
        db.query(VentaDetalle.producto_id, func.sum(VentaDetalle.cantidad))
        .join(Venta, Venta.id == VentaDetalle.venta_id)
        .filter(Venta.creado_en >= desde, Venta.creado_en < hasta)
        .group_by(VentaDetalle.producto_id)
        .all()
    )
    return {str(producto_id): int(cantidad) for producto_id, cantidad in filas}


@router.get("/tendencias", response_model=list[ProductoTendencia])
def tendencias(db: Session = Depends(get_db)):
    """Compara ventas de los ultimos 7 dias contra los 7 dias anteriores, por producto.

    No usa ningun modelo de IA: es una comparacion de velocidad de venta (semana actual
    vs. semana anterior) para detectar que productos estan "en tendencia" ahora mismo.
    """
    ahora = datetime.now(timezone.utc)
    inicio_semana_actual = ahora - timedelta(days=7)
    inicio_semana_anterior = ahora - timedelta(days=14)

    semana_actual = _unidades_vendidas_por_producto(db, inicio_semana_actual, ahora)
    semana_anterior = _unidades_vendidas_por_producto(db, inicio_semana_anterior, inicio_semana_actual)

    productos = db.query(Producto).filter(Producto.activo.is_(True)).all()

    resultado = []
    for producto in productos:
        pid = str(producto.id)
        u_actual = semana_actual.get(pid, 0)
        if u_actual == 0:
            continue
        u_anterior = semana_anterior.get(pid, 0)
        variacion_pct = None if u_anterior == 0 else round((u_actual - u_anterior) / u_anterior * 100, 1)
        resultado.append(
            ProductoTendencia(
                producto_id=producto.id,
                nombre=producto.nombre,
                unidades_semana_actual=u_actual,
                unidades_semana_anterior=u_anterior,
                variacion_pct=variacion_pct,
            )
        )

    resultado.sort(key=lambda p: p.unidades_semana_actual - p.unidades_semana_anterior, reverse=True)
    return resultado[:6]
