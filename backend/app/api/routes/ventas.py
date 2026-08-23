from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.producto import Producto
from app.models.turno_caja import TurnoCaja
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import Venta, VentaDetalle
from app.schemas.venta import VentaCrear, VentaDetalleSalida, VentaSalida

router = APIRouter(prefix="/api/ventas", tags=["ventas"])


def _a_salida(venta: Venta) -> VentaSalida:
    return VentaSalida(
        id=venta.id,
        usuario_id=venta.usuario_id,
        usuario_nombre=venta.usuario.nombre,
        total=venta.total,
        creado_en=venta.creado_en,
        detalles=[
            VentaDetalleSalida(
                producto_id=d.producto_id,
                nombre_producto=d.producto.nombre,
                cantidad=d.cantidad,
                precio_unitario=d.precio_unitario,
                costo_unitario=d.costo_unitario,
            )
            for d in venta.detalles
        ],
    )


@router.get("", response_model=list[VentaSalida], dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))])
def listar(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)):
    query = db.query(Venta).options(
        joinedload(Venta.usuario),
        joinedload(Venta.detalles).joinedload(VentaDetalle.producto),
    )
    if desde is not None:
        query = query.filter(Venta.creado_en >= datetime.combine(desde, time.min, tzinfo=timezone.utc))
    if hasta is not None:
        query = query.filter(Venta.creado_en <= datetime.combine(hasta, time.max, tzinfo=timezone.utc))

    ventas = query.order_by(Venta.creado_en.desc()).all()
    return [_a_salida(v) for v in ventas]


@router.post("", response_model=VentaSalida, status_code=201)
def crear(datos: VentaCrear, db: Session = Depends(get_db), usuario: Usuario = Depends(get_usuario_actual)):
    caja_abierta = db.query(TurnoCaja).filter(TurnoCaja.cierre_fecha.is_(None)).first()
    if caja_abierta is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una caja abierta. Pide al Admin que abra la caja antes de vender.",
        )

    productos_por_id: dict[str, Producto] = {}
    for item in datos.items:
        producto = db.get(Producto, item.producto_id)
        if producto is None or not producto.activo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto {item.producto_id} no encontrado")
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente de '{producto.nombre}' (quedan {producto.stock})",
            )
        productos_por_id[str(item.producto_id)] = producto

    total = sum(productos_por_id[str(item.producto_id)].precio * item.cantidad for item in datos.items)
    venta = Venta(usuario_id=usuario.id, total=total)
    db.add(venta)
    db.flush()

    for item in datos.items:
        producto = productos_por_id[str(item.producto_id)]
        producto.stock -= item.cantidad
        detalle = VentaDetalle(
            venta_id=venta.id,
            producto_id=producto.id,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
            costo_unitario=producto.costo,
        )
        db.add(detalle)

    db.commit()
    db.refresh(venta)
    return _a_salida(venta)
