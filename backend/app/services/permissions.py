"""
Permission and role-based access control service
"""
from app.models.user import User
from typing import List, Optional


# Permission definitions
PERMISSIONS = {
    "owner": [
        "view_all",
        "edit_all",
        "delete_all",
        "view_reports",
        "view_settings",
        "view_expenses",
        "view_cashbook",
        "view_cost_prices",
        "view_profit",
        "export_data",
        "manage_staff",
        "manage_branches",
        "reconcile_cash",
        "view_activity_log",
        "view_staff_insights",
    ],
    "manager": [
        "view_all",
        "edit_items",
        "edit_purchases",
        "create_invoices",
        "record_payments",
        "view_stock",
        "adjust_stock",
        "view_invoices",
        "view_suppliers",
        "view_purchases",
        # Cannot: delete, reports, settings, cost prices, profit, export, staff management
    ],
    "staff": [
        "create_invoices",
        "record_payments",
        "view_items",
        "view_stock",
        "view_invoices",
        "view_suppliers",
        "view_purchases",
        # Cannot: edit past invoices, delete, reports, settings, cost prices, profit, export
    ],
}


def has_permission(user: User, permission: str) -> bool:
    """
    Check if user has a specific permission
    
    Args:
        user: User object
        permission: Permission string to check
        
    Returns:
        True if user has permission, False otherwise
    """
    if not user.role:
        return False
    
    user_permissions = PERMISSIONS.get(user.role, [])
    return permission in user_permissions


def can_view_cost_prices(user: User) -> bool:
    """Check if user can view cost/purchase prices"""
    return has_permission(user, "view_cost_prices")


def can_view_profit(user: User) -> bool:
    """Check if user can view profit information"""
    return has_permission(user, "view_profit")


def can_edit_invoice(user: User, invoice_user_id: Optional[int] = None) -> bool:
    """
    Check if user can edit an invoice
    
    Staff can only edit invoices they created (if within time limit)
    Managers and owners can edit any invoice
    """
    if user.role == "owner":
        return True
    if user.role == "manager":
        return True
    if user.role == "staff":
        # Staff can only edit their own invoices if created recently (within 1 hour)
        if invoice_user_id == user.id:
            return True
    return False


def can_delete(user: User) -> bool:
    """Check if user can delete records"""
    return has_permission(user, "delete_all")


def can_access_reports(user: User) -> bool:
    """Check if user can access reports"""
    return has_permission(user, "view_reports")


def can_access_settings(user: User) -> bool:
    """Check if user can access settings"""
    return has_permission(user, "view_settings")


def can_export_data(user: User) -> bool:
    """Check if user can export data"""
    return has_permission(user, "export_data")


def can_manage_staff(user: User) -> bool:
    """Check if user can manage staff"""
    return has_permission(user, "manage_staff")


def can_reconcile_cash(user: User) -> bool:
    """Check if user can reconcile cash"""
    return has_permission(user, "reconcile_cash")


def can_adjust_stock(user: User, allow_staff_adjustments: bool = False) -> bool:
    """
    Check if user can adjust stock
    
    Args:
        user: User object
        allow_staff_adjustments: Business setting for allowing staff adjustments
    """
    if user.role == "owner" or user.role == "manager":
        return True
    if user.role == "staff" and allow_staff_adjustments:
        return True
    return False


def filter_sensitive_data(data: dict, user: User, show_sensitive: bool = False) -> dict:
    """
    Filter out sensitive data (cost prices, profit) based on user role
    
    Args:
        data: Data dictionary to filter
        user: User object
        show_sensitive: Owner toggle for sensitive data mode
        
    Returns:
        Filtered data dictionary
    """
    if user.role == "owner" and show_sensitive:
        return data  # Owner can see everything if toggle is on
    
    # Remove sensitive fields for non-owners
    sensitive_fields = [
        "buying_price",
        "cost_price",
        "purchase_price",
        "profit",
        "profit_margin",
        "valuation",
        "total_cost",
    ]
    
    filtered = data.copy()
    for field in sensitive_fields:
        if field in filtered:
            del filtered[field]
    
    return filtered

