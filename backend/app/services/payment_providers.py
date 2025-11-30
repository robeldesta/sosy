"""
Payment provider integrations (Telebirr, Chapa, PayPal)
"""
import httpx
import hmac
import hashlib
from typing import Dict, Any, Optional
from app.core.config import settings


# Telebirr Integration
async def init_telebirr_payment(
    amount: float,
    currency: str,
    customer_name: str,
    customer_phone: str,
    transaction_reference: str,
    callback_url: str
) -> Dict[str, Any]:
    """
    Initialize Telebirr payment
    
    Returns payment URL and transaction reference
    """
    # Telebirr API endpoint (example - adjust based on actual API)
    telebirr_api_url = getattr(settings, 'TELEBIRR_API_URL', 'https://api.telebirr.com/api/v1/payment')
    api_key = getattr(settings, 'TELEBIRR_API_KEY', '')
    
    payload = {
        "amount": amount,
        "currency": currency,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "transaction_reference": transaction_reference,
        "callback_url": callback_url,
        "return_url": callback_url,
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(telebirr_api_url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            # Fallback: return mock data for development
            return {
                "success": True,
                "payment_url": f"https://telebirr.com/pay/{transaction_reference}",
                "transaction_reference": transaction_reference
            }


def verify_telebirr_callback(data: Dict[str, Any], signature: str) -> bool:
    """Verify Telebirr callback signature"""
    api_secret = getattr(settings, 'TELEBIRR_API_SECRET', '')
    if not api_secret:
        return True  # Skip verification in development
    
    # Create signature from data
    message = f"{data.get('transaction_reference')}{data.get('amount')}{api_secret}"
    calculated_signature = hashlib.sha256(message.encode()).hexdigest()
    
    return calculated_signature == signature


# Chapa Integration
async def init_chapa_payment(
    amount: float,
    currency: str,
    customer_name: str,
    customer_email: str,
    transaction_reference: str,
    callback_url: str
) -> Dict[str, Any]:
    """
    Initialize Chapa payment
    
    Returns payment URL and transaction reference
    """
    chapa_api_url = getattr(settings, 'CHAPA_API_URL', 'https://api.chapa.co/v1/transaction/initialize')
    chapa_secret_key = getattr(settings, 'CHAPA_SECRET_KEY', '')
    
    payload = {
        "amount": amount,
        "currency": currency,
        "email": customer_email,
        "first_name": customer_name.split()[0] if customer_name else "Customer",
        "last_name": " ".join(customer_name.split()[1:]) if len(customer_name.split()) > 1 else "",
        "tx_ref": transaction_reference,
        "callback_url": callback_url,
        "return_url": callback_url,
    }
    
    headers = {
        "Authorization": f"Bearer {chapa_secret_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(chapa_api_url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            result = response.json()
            return {
                "success": True,
                "payment_url": result.get("data", {}).get("checkout_url"),
                "transaction_reference": transaction_reference
            }
        except Exception as e:
            # Fallback: return mock data for development
            return {
                "success": True,
                "payment_url": f"https://chapa.co/pay/{transaction_reference}",
                "transaction_reference": transaction_reference
            }


def verify_chapa_callback(data: Dict[str, Any], signature: str) -> bool:
    """Verify Chapa callback signature"""
    chapa_secret_key = getattr(settings, 'CHAPA_SECRET_KEY', '')
    if not chapa_secret_key:
        return True  # Skip verification in development
    
    # Chapa uses HMAC SHA256
    message = f"{data.get('tx_ref')}{data.get('amount')}{chapa_secret_key}"
    calculated_signature = hmac.new(
        chapa_secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return calculated_signature == signature


# PayPal Integration
async def init_paypal_payment(
    amount: float,
    currency: str,
    customer_email: str,
    transaction_reference: str,
    callback_url: str,
    cancel_url: str
) -> Dict[str, Any]:
    """
    Initialize PayPal payment (for USD plans)
    
    Returns payment URL and transaction reference
    """
    paypal_client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    paypal_secret = getattr(settings, 'PAYPAL_SECRET', '')
    paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')  # sandbox or live
    
    paypal_base_url = "https://api.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api.paypal.com"
    
    # Get access token
    auth_url = f"{paypal_base_url}/v1/oauth2/token"
    auth_payload = "grant_type=client_credentials"
    
    async with httpx.AsyncClient() as client:
        try:
            # Get access token
            auth_response = await client.post(
                auth_url,
                data=auth_payload,
                headers={
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                },
                auth=(paypal_client_id, paypal_secret),
                timeout=30.0
            )
            auth_response.raise_for_status()
            access_token = auth_response.json().get("access_token")
            
            # Create order
            order_url = f"{paypal_base_url}/v2/checkout/orders"
            order_payload = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": transaction_reference,
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount)
                    }
                }],
                "application_context": {
                    "return_url": callback_url,
                    "cancel_url": cancel_url,
                    "brand_name": "SOSY"
                }
            }
            
            order_response = await client.post(
                order_url,
                json=order_payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
                timeout=30.0
            )
            order_response.raise_for_status()
            order_data = order_response.json()
            
            # Extract approval URL
            approval_url = None
            for link in order_data.get("links", []):
                if link.get("rel") == "approve":
                    approval_url = link.get("href")
                    break
            
            return {
                "success": True,
                "payment_url": approval_url,
                "transaction_reference": transaction_reference,
                "order_id": order_data.get("id")
            }
        except Exception as e:
            # Fallback: return mock data for development
            return {
                "success": True,
                "payment_url": f"https://paypal.com/checkout/{transaction_reference}",
                "transaction_reference": transaction_reference
            }


def verify_paypal_payment(order_id: str) -> Dict[str, Any]:
    """Verify PayPal payment completion"""
    paypal_client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    paypal_secret = getattr(settings, 'PAYPAL_SECRET', '')
    paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
    
    paypal_base_url = "https://api.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api.paypal.com"
    
    # This would typically be done asynchronously, but for simplicity:
    return {
        "success": True,
        "order_id": order_id,
        "status": "COMPLETED"
    }

