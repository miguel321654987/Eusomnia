"""Add persistent nutrition input and Edamam nutrient fields."""

from alembic import op
import sqlalchemy as sa


revision = "a61c93d2e704"
down_revision = "d53beabedc13"
branch_labels = None
depends_on = None


def _columns_for(table_name):
    return {
        column["name"]: column
        for column in sa.inspect(op.get_bind()).get_columns(table_name)
    }


def _add_column_if_missing(table_name, column):
    if column.name not in _columns_for(table_name):
        op.add_column(table_name, column)


def _copy_legacy_values(target_name, source_name):
    columns = _columns_for("nutrition_logs")
    if target_name not in columns or source_name not in columns:
        return

    nutrition_logs = sa.table(
        "nutrition_logs",
        sa.column(target_name, sa.Float()),
        sa.column(source_name, sa.Float()),
    )
    op.get_bind().execute(
        nutrition_logs.update()
        .where(nutrition_logs.c[target_name].is_(None))
        .values({target_name: nutrition_logs.c[source_name]})
    )


def upgrade():
    habit_columns = _columns_for("habit_logs")
    _add_column_if_missing(
        "habit_logs",
        sa.Column("nutrition_query", sa.Text(), nullable=True),
    )
    _add_column_if_missing(
        "habit_logs",
        sa.Column("sleep_hours", sa.Float(), nullable=True),
    )

    with op.batch_alter_table("habit_logs") as batch_op:
        dinner_type = habit_columns["dinner_type"]
        if getattr(dinner_type["type"], "length", None) != 255:
            batch_op.alter_column(
                "dinner_type",
                existing_type=dinner_type["type"],
                type_=sa.String(length=255),
                existing_nullable=dinner_type["nullable"],
            )

    for column in (
        sa.Column("fats_g", sa.Float(), nullable=True),
        sa.Column("carbs_g", sa.Float(), nullable=True),
        sa.Column("vitamin_b12_mcg", sa.Float(), nullable=True),
    ):
        _add_column_if_missing("nutrition_logs", column)

    _copy_legacy_values("fats_g", "fat_g")
    _copy_legacy_values("carbs_g", "carbohydrates_g")
    _copy_legacy_values("vitamin_b12_mcg", "vitamin_b12_ug")

    nutrition_columns = _columns_for("nutrition_logs")
    with op.batch_alter_table("nutrition_logs") as batch_op:
        for column_name in (
            "calories",
            "caffeine_mg",
            "sugar_g",
            "sodium_mg",
            "protein_g",
            "fats_g",
            "carbs_g",
            "vitamin_b12_mcg",
            "vitamin_e_mg",
        ):
            column = nutrition_columns.get(column_name)
            if column and not column["nullable"]:
                batch_op.alter_column(
                    column_name,
                    existing_type=column["type"],
                    nullable=True,
                )

    analysis_columns = _columns_for("sleep_analyses")
    with op.batch_alter_table("sleep_analyses") as batch_op:
        for column_name in ("predominant_emotions", "detected_symbols"):
            column = analysis_columns[column_name]
            if not isinstance(column["type"], sa.Text):
                batch_op.alter_column(
                    column_name,
                    existing_type=column["type"],
                    type_=sa.Text(),
                    existing_nullable=column["nullable"],
                )


def downgrade():
    for table_name, column_names in (
        (
            "nutrition_logs",
            ("vitamin_b12_mcg", "carbs_g", "fats_g"),
        ),
        ("habit_logs", ("sleep_hours", "nutrition_query")),
    ):
        existing_columns = _columns_for(table_name)
        with op.batch_alter_table(table_name) as batch_op:
            for column_name in column_names:
                if column_name in existing_columns:
                    batch_op.drop_column(column_name)
