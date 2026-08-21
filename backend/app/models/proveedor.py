import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    contacto: Mapped[str | None] = mapped_column(String(160), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(40), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
