"""reconocimiento visual de productos (pgvector)

Revision ID: c1a2f4e9b7d3
Revises: 9db9974986cc
Create Date: 2026-08-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision: str = 'c1a2f4e9b7d3'
down_revision: Union[str, None] = '9db9974986cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DIMENSION_EMBEDDING = 2048


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    op.add_column('productos', sa.Column('imagen_datos', sa.LargeBinary(), nullable=True))
    op.add_column('productos', sa.Column('imagen_mime', sa.String(length=100), nullable=True))
    op.add_column('productos', sa.Column('embedding', Vector(DIMENSION_EMBEDDING), nullable=True))


def downgrade() -> None:
    op.drop_column('productos', 'embedding')
    op.drop_column('productos', 'imagen_mime')
    op.drop_column('productos', 'imagen_datos')
