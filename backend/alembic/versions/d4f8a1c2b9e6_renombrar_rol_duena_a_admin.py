"""renombrar rol DUENA a ADMIN

Revision ID: d4f8a1c2b9e6
Revises: c1a2f4e9b7d3
Create Date: 2026-08-23 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'd4f8a1c2b9e6'
down_revision: Union[str, None] = 'c1a2f4e9b7d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE rol_usuario RENAME VALUE 'DUENA' TO 'ADMIN'")


def downgrade() -> None:
    op.execute("ALTER TYPE rol_usuario RENAME VALUE 'ADMIN' TO 'DUENA'")
