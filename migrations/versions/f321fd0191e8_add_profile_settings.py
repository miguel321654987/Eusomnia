"""add profile settings

Revision ID: f321fd0191e8
Revises: 4ec7d1031b64
Create Date: 2026-10-29 14:29:15.322853

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f321fd0191e8'
down_revision = '4ec7d1031b64'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user_preferences', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'interpretation_framework',
            sa.String(length=30),
            server_default=sa.text("'jungian'"),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'report_depth',
            sa.String(length=30),
            server_default=sa.text("'standard'"),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'include_nutrition_in_analysis',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'morning_reminder_enabled',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'morning_reminder_time',
            sa.String(length=5),
            server_default=sa.text("'07:30'"),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'caffeine_reminder_enabled',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'caffeine_reminder_time',
            sa.String(length=5),
            server_default=sa.text("'18:00'"),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'winddown_reminder_enabled',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            'winddown_reminder_time',
            sa.String(length=5),
            server_default=sa.text("'22:30'"),
            nullable=False,
        ))

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('birth_year', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('chronotype', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('chronotype')
        batch_op.drop_column('birth_year')

    with op.batch_alter_table('user_preferences', schema=None) as batch_op:
        batch_op.drop_column('winddown_reminder_time')
        batch_op.drop_column('winddown_reminder_enabled')
        batch_op.drop_column('caffeine_reminder_time')
        batch_op.drop_column('caffeine_reminder_enabled')
        batch_op.drop_column('morning_reminder_time')
        batch_op.drop_column('morning_reminder_enabled')
        batch_op.drop_column('include_nutrition_in_analysis')
        batch_op.drop_column('report_depth')
        batch_op.drop_column('interpretation_framework')
