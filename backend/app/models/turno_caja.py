import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TurnoCaja(Base):
    """Apertura y cierre de caja. Solo el Admin puede crearlos (ver deps.requiere_rol)."""

    __tablename__ = "turnos_caja"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    apertura_fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    monto_apertura: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cierre_fecha: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    monto_cierre: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    usuario = relationship("Usuario")
