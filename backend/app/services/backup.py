"""
Daily backup service
"""
import json
import csv
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from sqlmodel import Session, select
from app.models.product import Product
from app.models.invoice import Invoice
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.models.business import Business


BACKUP_DIR = Path("/backups")
RETENTION_DAYS = 30


def ensure_backup_dir():
    """Ensure backup directory exists"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def export_to_json(data: Dict[str, List[Any]], filename: str) -> str:
    """Export data to JSON file"""
    ensure_backup_dir()
    filepath = BACKUP_DIR / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str, ensure_ascii=False)
    return str(filepath)


def export_to_csv(data: Dict[str, List[Any]], filename: str) -> str:
    """Export data to CSV file"""
    ensure_backup_dir()
    filepath = BACKUP_DIR / filename
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = None
        for table_name, rows in data.items():
            if not rows:
                continue
            
            # Write table name as header
            f.write(f"# {table_name}\n")
            
            # Get fieldnames from first row
            fieldnames = list(rows[0].keys()) if rows else []
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
            f.write("\n")
    
    return str(filepath)


def create_backup(session: Session, business_id: int, format: str = "json") -> str:
    """
    Create backup for a business
    
    Args:
        session: Database session
        business_id: Business ID to backup
        format: Backup format ('json' or 'csv')
        
    Returns:
        Path to backup file
    """
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # Fetch all data
    products = session.exec(
        select(Product).where(Product.business_id == business_id)
    ).all()
    
    invoices = session.exec(
        select(Invoice).where(Invoice.business_id == business_id)
    ).all()
    
    purchases = session.exec(
        select(Purchase).where(Purchase.business_id == business_id)
    ).all()
    
    suppliers = session.exec(
        select(Supplier).where(Supplier.business_id == business_id)
    ).all()
    
    business = session.get(Business, business_id)
    
    # Convert to dict format
    backup_data = {
        "metadata": {
            "business_id": business_id,
            "business_name": business.name if business else "Unknown",
            "backup_date": date_str,
            "backup_timestamp": timestamp,
        },
        "products": [product.model_dump() for product in products],
        "invoices": [invoice.model_dump() for invoice in invoices],
        "purchases": [purchase.model_dump() for purchase in purchases],
        "suppliers": [supplier.model_dump() for supplier in suppliers],
    }
    
    # Export based on format
    if format == "csv":
        filename = f"backup_{business_id}_{timestamp}.csv"
        return export_to_csv(backup_data, filename)
    else:
        filename = f"backup_{business_id}_{timestamp}.json"
        return export_to_json(backup_data, filename)


def cleanup_old_backups():
    """Remove backups older than retention period"""
    ensure_backup_dir()
    
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    
    for filepath in BACKUP_DIR.glob("backup_*.json"):
        try:
            file_time = datetime.fromtimestamp(filepath.stat().st_mtime)
            if file_time < cutoff_date:
                filepath.unlink()
        except Exception:
            continue
    
    for filepath in BACKUP_DIR.glob("backup_*.csv"):
        try:
            file_time = datetime.fromtimestamp(filepath.stat().st_mtime)
            if file_time < cutoff_date:
                filepath.unlink()
        except Exception:
            continue


def get_latest_backup(business_id: int) -> Optional[str]:
    """Get path to latest backup for a business"""
    ensure_backup_dir()
    
    pattern = f"backup_{business_id}_*.json"
    backups = sorted(BACKUP_DIR.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    
    return str(backups[0]) if backups else None

