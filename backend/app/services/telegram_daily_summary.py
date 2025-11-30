"""
Telegram daily summary notification service
"""
import httpx
from datetime import datetime
from app.core.config import settings
from app.services.daily_summary_service import get_daily_summary
from sqlmodel import Session
from typing import Optional


TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"


async def send_daily_summary(
    session: Session,
    business_id: int,
    chat_id: int,
    date: Optional[datetime] = None
) -> bool:
    """
    Send daily summary via Telegram bot
    
    Args:
        session: Database session
        business_id: Business ID
        chat_id: Telegram chat ID to send to
        date: Date for summary (defaults to today)
        
    Returns:
        True if sent successfully, False otherwise
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        print("TELEGRAM_BOT_TOKEN is not set. Skipping Telegram notification.")
        return False
    
    try:
        summary = get_daily_summary(session, business_id, date)
        
        # Format message
        message = f"📊 <b>Daily Summary - {summary['date']}</b>\n\n"
        message += f"💰 Sales: <b>{summary['total_sales']:.2f} ETB</b>\n"
        message += f"💵 Collected: <b>{summary['total_collected']:.2f} ETB</b>\n"
        message += f"💸 Expenses: <b>{summary['total_expenses']:.2f} ETB</b>\n"
        message += f"📈 Net Cash: <b>{summary['net_cash']:.2f} ETB</b>\n\n"
        
        if summary['top_item']:
            message += f"🏆 Top Item: <b>{summary['top_item']['name']}</b> ({summary['top_item']['quantity']} sold)\n"
        
        if summary['low_stock_count'] > 0:
            message += f"⚠️ Low Stock: <b>{summary['low_stock_count']}</b> items need restocking\n"
        else:
            message += "✅ Stock levels are good\n"
        
        # Send via Telegram
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TELEGRAM_API_URL}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                }
            )
            response.raise_for_status()
            return True
            
    except Exception as e:
        print(f"Error sending daily summary: {e}")
        return False

