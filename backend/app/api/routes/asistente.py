from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from groq import Groq
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import requiere_rol
from app.core.config import settings
from app.db.session import get_db
from app.models.producto import Producto
from app.models.usuario import RolUsuario
from app.models.venta import Venta, VentaDetalle
from app.schemas.asistente import PreguntaEntrada, RespuestaAsistente

router = APIRouter(
    prefix="/api/asistente",
    tags=["asistente"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)

DIAS_TENDENCIA = 30

SYSTEM_INSTRUCTION = (
    "Eres el asistente de SweetDay, una tienda de aeropuerto. Respondes en español, de forma breve "
    "y directa, usando unicamente los DATOS DEL NEGOCIO que se entregan junto con la pregunta. "
    "Si la pregunta no se puede responder con esos datos, dilo claramente en vez de inventar cifras. "
    "No des consejos genericos de negocio que no se te pidan, responde solo lo preguntado."
)


def _construir_contexto(db: Session) -> str:
    hoy = datetime.now(timezone.utc).date()
    desde_tendencia = datetime.combine(hoy - timedelta(days=DIAS_TENDENCIA), time.min, tzinfo=timezone.utc)
    inicio_hoy = datetime.combine(hoy, time.min, tzinfo=timezone.utc)

    productos = db.query(Producto).filter(Producto.activo.is_(True)).order_by(Producto.nombre).all()
    lineas_stock = [f"- {p.nombre}: {p.stock} unidades (precio Bs {p.precio})" for p in productos]

    mas_vendidos = (
        db.query(Producto.nombre, func.sum(VentaDetalle.cantidad).label("unidades"))
        .join(VentaDetalle, VentaDetalle.producto_id == Producto.id)
        .join(Venta, Venta.id == VentaDetalle.venta_id)
        .filter(Venta.creado_en >= desde_tendencia)
        .group_by(Producto.nombre)
        .order_by(func.sum(VentaDetalle.cantidad).desc())
        .limit(10)
        .all()
    )
    lineas_top = [
        f"- {nombre}: {unidades} unidades vendidas en los ultimos {DIAS_TENDENCIA} dias" for nombre, unidades in mas_vendidos
    ]

    ingresos_hoy = db.query(func.coalesce(func.sum(Venta.total), 0)).filter(Venta.creado_en >= inicio_hoy).scalar()

    partes = [
        f"Fecha actual: {hoy.isoformat()}",
        f"Ingresos de hoy: Bs {ingresos_hoy}",
        "",
        "Inventario actual (productos activos):",
        *(lineas_stock or ["(sin productos activos)"]),
        "",
        f"Productos mas vendidos (ultimos {DIAS_TENDENCIA} dias):",
        *(lineas_top or ["(sin ventas registradas en este periodo)"]),
    ]
    return "\n".join(partes)


@router.post("/preguntar", response_model=RespuestaAsistente)
def preguntar(datos: PreguntaEntrada, db: Session = Depends(get_db)):
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El asistente no esta configurado (falta GROQ_API_KEY en el backend).",
        )

    contexto = _construir_contexto(db)
    entrada = f"DATOS DEL NEGOCIO:\n{contexto}\n\nPREGUNTA DEL DUENO:\n{datos.pregunta}"

    try:
        client = Groq(api_key=settings.groq_api_key)
        respuesta = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": entrada},
            ],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo consultar al asistente en este momento. Intenta de nuevo.",
        ) from exc

    return RespuestaAsistente(respuesta=respuesta.choices[0].message.content)
