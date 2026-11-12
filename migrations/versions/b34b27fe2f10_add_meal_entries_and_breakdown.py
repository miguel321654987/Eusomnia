"""Add structured meal entries and nutrition breakdowns.

Revision ID: b34b27fe2f10
Revises: f321fd0191e8
Create Date: 2026-10-30
"""
from alembic import op
import sqlalchemy as sa


revision = "b34b27fe2f10"
down_revision = "f321fd0191e8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("habit_logs", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("meal_entries", sa.Text(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("sleep_context", sa.Text(), nullable=True)
        )

    with op.batch_alter_table("nutrition_logs", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("meal_breakdown", sa.Text(), nullable=True)
        )


def downgrade():
    with op.batch_alter_table("nutrition_logs", schema=None) as batch_op:
        batch_op.drop_column("meal_breakdown")

    with op.batch_alter_table("habit_logs", schema=None) as batch_op:
        batch_op.drop_column("sleep_context")
        batch_op.drop_column("meal_entries")
