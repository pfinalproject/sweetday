"""anular compras

Revision ID: a1c9e4f27b3d
Revises: f27b6d94a813
Create Date: 2026-08-27 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1c9e4f27b3d'
down_revision: Union[str, None] = 'f27b6d94a813'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'compras',
        sa.Column('anulada', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.add_column('compras', sa.Column('anulada_en', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('compras', 'anulada_en')
    op.drop_column('compras', 'anulada')
