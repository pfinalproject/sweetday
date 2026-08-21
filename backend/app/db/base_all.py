"""Importa todos los modelos para que Alembic los descubra al autogenerar migraciones."""

from app.db.base import Base  # noqa: F401
from app.models.usuario import Usuario  # noqa: F401
from app.models.categoria import Categoria  # noqa: F401
from app.models.proveedor import Proveedor  # noqa: F401
from app.models.producto import Producto  # noqa: F401
from app.models.venta import Venta, VentaDetalle  # noqa: F401
from app.models.compra import Compra  # noqa: F401
from app.models.turno_caja import TurnoCaja  # noqa: F401
from app.models.alerta import Alerta  # noqa: F401
