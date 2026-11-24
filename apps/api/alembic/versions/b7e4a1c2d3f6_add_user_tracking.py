"""Add user tracking columns (signup method, last sign-in, sign-in count)

Revision ID: b7e4a1c2d3f6
Revises: 9c1d2e3f4a5b
Create Date: 2026-11-18 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e4a1c2d3f6'
down_revision: Union[str, Sequence[str], None] = '9c1d2e3f4a5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # batch mode so SQLite (the dev database) can add columns safely.
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('signup_method', sa.String(), nullable=True))
        batch.add_column(sa.Column('last_login_at', sa.DateTime(), nullable=True))
        batch.add_column(sa.Column('last_login_method', sa.String(), nullable=True))
        # server_default so every existing row gets 0 in one step.
        batch.add_column(sa.Column('login_count', sa.Integer(), nullable=False, server_default='0'))

    # Existing accounts: a Google id means the account came from Google.
    # Their past sign-ins were not recorded, so last_login_at stays empty.
    op.execute("UPDATE users SET signup_method = 'google' WHERE google_sub IS NOT NULL")
    op.execute("UPDATE users SET signup_method = 'password' WHERE google_sub IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users') as batch:
        batch.drop_column('login_count')
        batch.drop_column('last_login_method')
        batch.drop_column('last_login_at')
        batch.drop_column('signup_method')
