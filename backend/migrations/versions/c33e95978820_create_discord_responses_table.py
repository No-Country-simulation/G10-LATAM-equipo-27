"""create discord responses table

Revision ID: c33e95978820
Revises: 783234583028
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c33e95978820"
down_revision: Union[str, Sequence[str], None] = "783234583028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "discord_responses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("interaccion_id", sa.Integer(), nullable=False),
        sa.Column("authorized_by_user_id", sa.Integer(), nullable=True),
        sa.Column("respuesta", sa.Text(), nullable=False),
        sa.Column("guild_id", sa.String(32), nullable=False),
        sa.Column("channel_id", sa.String(32), nullable=False),
        sa.Column("source_message_id", sa.String(32), nullable=False),
        sa.Column("discord_message_id", sa.String(32), nullable=True),
        sa.Column(
            "estado",
            sa.String(30),
            nullable=False,
            server_default="enviando",
        ),
        sa.Column(
            "intento_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "publicado_en",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("error_detalle", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["authorized_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint(
            "interaccion_id",
            name="uq_discord_responses_interaccion",
        ),
        sa.CheckConstraint(
            "estado IN ('enviando', 'publicado', 'resultado_desconocido')",
            name="ck_discord_responses_estado",
        ),
    )


def downgrade() -> None:
    op.drop_table("discord_responses")
