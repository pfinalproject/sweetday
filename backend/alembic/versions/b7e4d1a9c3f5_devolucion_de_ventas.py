"""devolucion de ventas

Revision ID: b7e4d1a9c3f5
Revises: f27b6d94a813
Create Date: 2026-08-27 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e4d1a9c3f5'
down_revision: Union[str, None] = 'a1c9e4f27b3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'ventas',
        sa.Column('devuelta', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.add_column('ventas', sa.Column('devuelta_en', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('ventas', 'devuelta_en')
    op.drop_column('ventas', 'devuelta')
