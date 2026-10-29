"""Preserve original daily entry date."""

from alembic import op
import sqlalchemy as sa


revision = '4ec7d1031b64'
down_revision = 'f4c18b7e9a20'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "daily_entries",
        sa.Column("original_entry_date", sa.Date(), nullable=True),
    )
    daily_entries = sa.table(
        "daily_entries",
        sa.column("entry_date", sa.Date()),
        sa.column("original_entry_date", sa.Date()),
    )
    op.get_bind().execute(
        sa.update(daily_entries).values(
            original_entry_date=daily_entries.c.entry_date,
        )
    )
    with op.batch_alter_table("daily_entries") as batch_op:
        batch_op.alter_column(
            "original_entry_date",
            existing_type=sa.Date(),
            nullable=False,
        )


def downgrade():
    with op.batch_alter_table("daily_entries") as batch_op:
        batch_op.drop_column("original_entry_date")
