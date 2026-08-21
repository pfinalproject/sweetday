import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TipoAlerta(str, enum.Enum):
    STOCK_BAJO = "STOCK_BAJO"
    PREDICCION_QUIEBRE = "PREDICCION_QUIEBRE"


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    producto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("productos.id"), nullable=False)
    tipo: Mapped[TipoAlerta] = mapped_column(Enum(TipoAlerta, name="tipo_alerta"), nullable=False)
    atendida: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    producto = relationship("Producto")
