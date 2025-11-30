"""
Background task scheduler for daily backups
"""
import asyncio
from datetime import datetime, time
from sqlmodel import Session
from app.db.session import get_session
from app.services.backup import create_backup, cleanup_old_backups
from app.models.business import Business
from sqlmodel import select


async def daily_backup_task():
    """Run daily backup for all businesses"""
    while True:
        try:
            # Wait until 2 AM
            now = datetime.now()
            target_time = time(2, 0)  # 2:00 AM
            
            if now.time() < target_time:
                # Wait until 2 AM today
                wait_until = datetime.combine(now.date(), target_time)
            else:
                # Wait until 2 AM tomorrow
                wait_until = datetime.combine(now.date(), target_time)
                wait_until = wait_until.replace(day=wait_until.day + 1)
            
            wait_seconds = (wait_until - now).total_seconds()
            await asyncio.sleep(wait_seconds)
            
            # Create backups for all businesses
            session: Session = next(get_session())
            try:
                businesses = session.exec(select(Business)).all()
                for business in businesses:
                    try:
                        create_backup(session, business.id, format="json")
                        print(f"Backup created for business {business.id}")
                    except Exception as e:
                        print(f"Failed to backup business {business.id}: {e}")
                
                # Cleanup old backups
                cleanup_old_backups()
            finally:
                session.close()
                
        except Exception as e:
            print(f"Error in daily backup task: {e}")
            # Wait 1 hour before retrying
            await asyncio.sleep(3600)


def start_background_tasks():
    """Start background tasks (call this in main.py startup)"""
    # Note: In production, use a proper task queue like Celery or RQ
    # For now, we'll use asyncio background task
    asyncio.create_task(daily_backup_task())

