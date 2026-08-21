import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
