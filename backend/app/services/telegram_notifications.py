import httpx
from app.core.config import settings
from typing import Optional


async def send_telegram_message(
    chat_id: int,
    message: str,
    parse_mode: Optional[str] = "HTML"
) -> bool:
    """Send a message via Telegram Bot API"""
    if not settings.TELEGRAM_BOT_TOKEN:
        return False
    
    bot_token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": parse_mode
                },
                timeout=10.0
            )
            response.raise_for_status()
            return True
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return False


async def send_low_stock_alert(
    chat_id: int,
    product_name: str,
    current_stock: float,
    reorder_point: float
) -> bool:
    """Send low stock alert notification"""
    message = (
        f"⚠️ <b>Low Stock Alert</b>\n\n"
        f"Product: {product_name}\n"
        f"Current Stock: {current_stock}\n"
        f"Reorder Point: {reorder_point}\n\n"
        f"Please restock soon!"
    )
    return await send_telegram_message(chat_id, message)


async def send_daily_summary(
    chat_id: int,
    date: str,
    sales: float,
    purchases: float,
    low_stock_count: int
) -> bool:
    """Send daily summary notification"""
    message = (
        f"📊 <b>Daily Summary - {date}</b>\n\n"
        f"💰 Sales: {sales:,.2f} ETB\n"
        f"🛒 Purchases: {purchases:,.2f} ETB\n"
        f"⚠️ Low Stock Items: {low_stock_count}\n\n"
        f"Have a great day!"
    )
    return await send_telegram_message(chat_id, message)

