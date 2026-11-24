"""Add users.google_sub for Google sign-in

Revision ID: 9c1d2e3f4a5b
Revises: 0a51ca1a782f
Create Date: 2026-11-18 12:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c1d2e3f4a5b'
down_revision: Union[str, Sequence[str], None] = '0a51ca1a782f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # batch mode so SQLite (the dev database) can add a unique index too.
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('google_sub', sa.String(), nullable=True))
        batch.create_index('ix_users_google_sub', ['google_sub'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users') as batch:
        batch.drop_index('ix_users_google_sub')
        batch.drop_column('google_sub')
