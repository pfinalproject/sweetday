"""motivo de devolucion

Revision ID: d3f6b2a8e1c4
Revises: b7e4d1a9c3f5
Create Date: 2026-08-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f6b2a8e1c4'
down_revision: Union[str, None] = 'b7e4d1a9c3f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ventas', sa.Column('motivo_devolucion', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('ventas', 'motivo_devolucion')
