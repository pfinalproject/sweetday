import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    codigo_barras: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    costo: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(default=0)
    imagen_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    categoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    categoria = relationship("Categoria")

    proveedor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=False)
    proveedor = relationship("Proveedor")
