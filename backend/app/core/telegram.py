import hashlib
import hmac
from typing import Dict, Optional
from app.core.config import settings


def verify_telegram_auth(data: Dict[str, str]) -> bool:
    """
    Verify Telegram authentication data.
    See: https://core.telegram.org/widgets/login#checking-authorization
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        # In development, skip verification if bot token is not set
        return True
    
    # Extract hash from data
    received_hash = data.pop("hash", None)
    if not received_hash:
        return False
    
    # Create data check string
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    
    # Create secret key
    secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    
    # Calculate hash
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return calculated_hash == received_hash

