"""Add semantic embeddings and push notification support.

Revision ID: 0002_ai_notifications
Revises: 0001_user_ownership
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_ai_notifications"
down_revision = "0001_user_ownership"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    reminder_columns = {c["name"] for c in inspector.get_columns("reminders")}
    if "notification_sent_at" not in reminder_columns:
        op.add_column("reminders", sa.Column("notification_sent_at", sa.DateTime(timezone=True), nullable=True))

    if "note_embeddings" not in inspector.get_table_names():
        op.create_table(
            "note_embeddings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("note_id", sa.Integer(), sa.ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, unique=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("vector_data", sa.JSON(), nullable=False),
            sa.Column("content_hash", sa.String(64), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_note_embeddings_note_id", "note_embeddings", ["note_id"])
        op.create_index("ix_note_embeddings_user_id", "note_embeddings", ["user_id"])

    if "device_push_tokens" not in inspector.get_table_names():
        op.create_table(
            "device_push_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("expo_push_token", sa.String(255), nullable=False, unique=True),
            sa.Column("device_name", sa.String(120), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_device_push_tokens_user_id", "device_push_tokens", ["user_id"])

    if "user_notifications" not in inspector.get_table_names():
        op.create_table(
            "user_notifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("reminder_id", sa.Integer(), sa.ForeignKey("reminders.id", ondelete="SET NULL"), nullable=True),
            sa.Column("title", sa.String(200), nullable=False),
            sa.Column("body", sa.Text(), nullable=False, server_default=""),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_user_notifications_user_id", "user_notifications", ["user_id"])


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    for table in ("user_notifications", "device_push_tokens", "note_embeddings"):
        if table in inspector.get_table_names():
            for index in inspect(bind).get_indexes(table):
                op.drop_index(index["name"], table_name=table)
            op.drop_table(table)
    if "reminders" in inspect(bind).get_table_names():
        cols = {c["name"] for c in inspect(bind).get_columns("reminders")}
        if "notification_sent_at" in cols:
            op.drop_column("reminders", "notification_sent_at")
