"""agregar creado_en a productos

Revision ID: e5a3c8f1d276
Revises: d4f8a1c2b9e6
Create Date: 2026-08-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5a3c8f1d276'
down_revision: Union[str, None] = 'd4f8a1c2b9e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'productos',
        sa.Column('creado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('productos', 'creado_en')
