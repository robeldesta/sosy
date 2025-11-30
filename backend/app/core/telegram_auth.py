"""
Telegram authentication utilities
"""
import hmac
import hashlib
import urllib.parse
from typing import Optional, Dict
from datetime import datetime, timedelta
from app.core.config import settings


def verify_telegram_init_data(init_data: str, bot_token: str) -> bool:
    """
    Verify Telegram WebApp initData signature
    
    Args:
        init_data: The initData string from Telegram WebApp
        bot_token: Telegram bot token
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Parse init_data
        parsed = urllib.parse.parse_qs(init_data)
        
        # Get hash from init_data
        received_hash = parsed.get('hash', [None])[0]
        if not received_hash:
            return False
        
        # Remove hash from data
        data_check_string = '&'.join(
            f'{k}={v[0]}'
            for k, v in sorted(parsed.items())
            if k != 'hash'
        )
        
        # Create secret key
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Compare hashes
        return calculated_hash == received_hash
    except Exception:
        return False


def parse_telegram_user(init_data: str) -> Optional[Dict]:
    """
    Parse user data from Telegram initData
    
    Returns:
        Dict with user data or None if invalid
    """
    try:
        parsed = urllib.parse.parse_qs(init_data)
        user_str = parsed.get('user', [None])[0]
        if not user_str:
            return None
        
        import json
        user_data = json.loads(user_str)
        return user_data
    except Exception:
        return None


def check_auth_date(init_data: str, max_age_seconds: int = 86400) -> bool:
    """
    Check if initData auth_date is recent (not older than max_age_seconds)
    
    Args:
        init_data: The initData string
        max_age_seconds: Maximum age in seconds (default 24 hours)
        
    Returns:
        True if auth_date is recent, False otherwise
    """
    try:
        parsed = urllib.parse.parse_qs(init_data)
        auth_date_str = parsed.get('auth_date', [None])[0]
        if not auth_date_str:
            return False
        
        auth_date = int(auth_date_str)
        current_time = int(datetime.utcnow().timestamp())
        
        return (current_time - auth_date) <= max_age_seconds
    except Exception:
        return False

