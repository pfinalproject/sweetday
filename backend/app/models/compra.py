import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Compra(Base):
    """Reabastecimiento de un producto: lo que se le paga a un proveedor. Es un egreso."""

    __tablename__ = "compras"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    producto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("productos.id"), nullable=False)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    producto = relationship("Producto")
    proveedor = relationship("Proveedor")
