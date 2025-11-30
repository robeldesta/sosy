"""
Stock CSV import API endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session
from typing import List, Dict, Any
import csv
import io
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.services.business import get_business_by_user_id
from app.services.inventory_service import add_product

router = APIRouter(prefix="/stock", tags=["stock-import"])


@router.get("/import/template")
async def get_import_template(
    current_user: User = Depends(get_current_user),
):
    """Download CSV import template"""
    from fastapi.responses import Response
    
    template = "Name,Stock,Price,Cost,SKU,Unit,Min Stock\n"
    template += "Example Product,100,50.00,30.00,SKU001,pcs,10\n"
    
    return Response(
        content=template,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stock_import_template.csv"}
    )


@router.post("/import")
async def import_stock_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import products from CSV file"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    # Read CSV content
    content = await file.read()
    csv_content = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_content)
    
    results = {
        "success": [],
        "errors": [],
        "total": 0
    }
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
        try:
            # Validate required fields
            name = row.get('Name', '').strip()
            if not name:
                results["errors"].append({
                    "row": row_num,
                    "error": "Name is required",
                    "data": row
                })
                continue
            
            # Parse fields
            stock = float(row.get('Stock', 0) or 0)
            price = float(row.get('Price', 0) or 0)
            cost = float(row.get('Cost', 0) or 0)
            sku = row.get('SKU', '').strip() or None
            unit = row.get('Unit', 'pcs').strip() or 'pcs'
            min_stock = float(row.get('Min Stock', 0) or 0) or None
            
            # Create product
            product = Product(
                business_id=business.id,
                name=name,
                sku=sku,
                unit_of_measure=unit,
                buying_price=cost,
                selling_price=price,
                low_stock_threshold=min_stock,
                is_active=True
            )
            db.add(product)
            db.commit()
            db.refresh(product)
            
            # Create stock item
            if stock > 0:
                stock_item = StockItem(
                    product_id=product.id,
                    quantity=stock,
                    location="main"
                )
                db.add(stock_item)
                db.commit()
            
            results["success"].append({
                "row": row_num,
                "product_id": product.id,
                "name": product.name
            })
            results["total"] += 1
            
        except ValueError as e:
            results["errors"].append({
                "row": row_num,
                "error": f"Invalid number format: {str(e)}",
                "data": row
            })
        except Exception as e:
            results["errors"].append({
                "row": row_num,
                "error": str(e),
                "data": row
            })
    
    return results

