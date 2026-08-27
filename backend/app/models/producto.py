import uuid
from datetime import datetime
from decimal import Decimal

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, ForeignKey, LargeBinary, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

DIMENSION_EMBEDDING = 2048


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
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Foto real subida por el Admin (para reconocimiento visual) y su embedding CLIP/ResNet.
    imagen_datos: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    imagen_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(DIMENSION_EMBEDDING), nullable=True)

    @property
    def tiene_foto(self) -> bool:
        return self.imagen_datos is not None

    categoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    categoria = relationship("Categoria")

    proveedor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=False)
    proveedor = relationship("Proveedor")
