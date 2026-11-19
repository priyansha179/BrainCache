"""Standalone due-reminder worker. Run with: python -m app.notification_worker."""
import asyncio
from datetime import datetime, timezone
import logging
import httpx

from .database import SessionLocal
from . import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("braincache.notifications")
EXPO_URL = "https://exp.host/--/api/v2/push/send"


async def deliver_due_reminders():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(models.Reminder).filter(
            models.Reminder.is_completed.is_(False),
            models.Reminder.remind_at <= now,
            models.Reminder.notification_sent_at.is_(None),
            models.Reminder.user_id.is_not(None),
        ).limit(100).all()
        async with httpx.AsyncClient(timeout=20.0) as client:
            for reminder in due:
                tokens = db.query(models.DevicePushToken).filter_by(user_id=reminder.user_id).all()
                db.add(models.UserNotification(
                    user_id=reminder.user_id, reminder_id=reminder.id,
                    title=reminder.title, body=reminder.message or "Your reminder is due.",
                ))
                if tokens:
                    messages = [{
                        "to": token.expo_push_token,
                        "title": reminder.title,
                        "body": reminder.message or "Your reminder is due.",
                        "sound": "default",
                        "data": {"reminder_id": reminder.id},
                    } for token in tokens]
                    try:
                        response = await client.post(EXPO_URL, json=messages)
                        response.raise_for_status()
                    except httpx.HTTPError:
                        logger.exception("Expo push delivery failed for reminder %s", reminder.id)
                        db.rollback()
                        continue
                reminder.notification_sent_at = now
                db.commit()
                logger.info("Processed reminder %s", reminder.id)
    finally:
        db.close()


async def main():
    logger.info("BrainCache reminder worker started; polling every 30 seconds.")
    while True:
        try:
            await deliver_due_reminders()
        except Exception:
            logger.exception("Reminder worker iteration failed")
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(main())
