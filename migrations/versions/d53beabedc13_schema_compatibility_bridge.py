"""Reconcile the historical schema recorded by existing SQLite databases."""

from alembic import op
import sqlalchemy as sa


revision = "d53beabedc13"
down_revision = "9abaf4c1628b"
branch_labels = None
depends_on = None


def _add_column_if_missing(table_name, column):
    bind = op.get_bind()
    existing_columns = {
        item["name"] for item in sa.inspect(bind).get_columns(table_name)
    }
    if column.name not in existing_columns:
        op.add_column(table_name, column)


def upgrade():
    _add_column_if_missing(
        "habit_logs",
        sa.Column("total_sleep_hours", sa.Float(), nullable=True),
    )
    _add_column_if_missing(
        "habit_logs",
        sa.Column("sleep_quality", sa.String(length=50), nullable=True),
    )

    nutrition_columns = (
        sa.Column(
            "protein_g",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "carbohydrates_g",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "fat_g",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "alcohol_g",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "omega3_mg",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "vitamin_e_mg",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "vitamin_b12_ug",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "total_weight_g",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("meal_type", sa.String(length=20), nullable=True),
        sa.Column(
            "other_excitants_present",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    for column in nutrition_columns:
        _add_column_if_missing("nutrition_logs", column)


def downgrade():
    raise RuntimeError(
        "The original revision is unavailable, so this compatibility bridge "
        "cannot be downgraded safely."
    )
