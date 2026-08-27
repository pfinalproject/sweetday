import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Venta(Base):
    __tablename__ = "ventas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    anulada: Mapped[bool] = mapped_column(Boolean, default=False)
    anulada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    usuario = relationship("Usuario")
    detalles = relationship("VentaDetalle", back_populates="venta", cascade="all, delete-orphan")


class VentaDetalle(Base):
    __tablename__ = "venta_detalle"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ventas.id"), nullable=False)
    producto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("productos.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")
