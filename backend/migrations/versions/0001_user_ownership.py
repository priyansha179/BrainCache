"""Create user accounts and attach personal records to their owner.

Revision ID: 0001_user_ownership
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0001_user_ownership"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    # Create every missing table on a fresh database. Existing tables are left intact.
    from app.database import Base
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=bind)
    inspector = inspect(bind)
    if "users" not in inspector.get_table_names():
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    for table in ("notes", "tasks", "reminders", "calendar_events"):
        if table not in inspect(bind).get_table_names():
            continue
        columns = {column["name"] for column in inspect(bind).get_columns(table)}
        if "user_id" not in columns:
            op.add_column(table, sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True))
            op.create_index(f"ix_{table}_user_id", table, ["user_id"])
            # Existing records remain unassigned and are not exposed to new accounts.
            # Users can manually export/recreate legacy records after reviewing them.


def downgrade():
    bind = op.get_bind()
    for table in ("notes", "tasks", "reminders", "calendar_events"):
        if table in inspect(bind).get_table_names():
            columns = {column["name"] for column in inspect(bind).get_columns(table)}
            if "user_id" in columns:
                op.drop_index(f"ix_{table}_user_id", table_name=table)
                with op.batch_alter_table(table) as batch_op:
                    batch_op.drop_column("user_id")
    if "users" in inspect(bind).get_table_names():
        op.drop_index("ix_users_email", table_name="users")
        op.drop_index("ix_users_id", table_name="users")
        op.drop_table("users")
