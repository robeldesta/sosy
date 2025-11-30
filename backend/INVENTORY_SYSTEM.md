# Inventory System Implementation

## Overview
Core inventory management system for Telegram Mini App retail management product.

## Models

### Product
Master product catalog with pricing and metadata.
- `id`: Primary key
- `business_id`: Foreign key to Business
- `name`: Product name
- `sku`: Optional SKU code
- `category`: Optional category
- `unit_of_measure`: Unit of measurement (default: "pcs")
- `buying_price`: Purchase price
- `selling_price`: Sale price
- `low_stock_threshold`: Optional threshold for low stock alerts
- `is_active`: Active status flag
- `created_at`, `updated_at`: Timestamps

### StockItem
Tracks current stock quantity per product and location.
- `id`: Primary key
- `product_id`: Foreign key to Product
- `quantity`: Current stock quantity (float)
- `location`: Storage location (default: "main")
- `last_updated`: Last update timestamp

### InventoryMovement
Audit trail of all inventory changes.
- `id`: Primary key
- `product_id`: Foreign key to Product
- `movement_type`: Type of movement (see below)
- `quantity`: Quantity changed
- `reference`: Optional reference (invoice number, etc.)
- `created_at`: Movement timestamp
- `user_id`: Optional user who made the change

## Movement Types

### Add to Inventory
- `purchase_add`: Purchase/restocking
- `adjustment_up`: Manual adjustment increase
- `return_in`: Customer return

### Subtract from Inventory
- `sale`: Sale transaction
- `adjustment_down`: Manual adjustment decrease
- `return_out`: Return to supplier

## Services

### inventory_service

#### `add_product(session, business_id, product_data)`
Creates a new product and initializes stock item at "main" location.

#### `record_movement(session, product_id, movement_data, user_id)`
Records an inventory movement and automatically updates StockItem quantity:
- Creates InventoryMovement record
- Updates StockItem based on movement_type
- Prevents negative stock (sets to 0)

#### `calculate_stock(session, product_id, location)`
Returns current stock quantity for a product at a specific location.

#### `list_stock(session, business_id, location)`
Lists all stock items for a business, optionally filtered by location.

#### `get_product_movements(session, product_id, limit)`
Retrieves movement history for a product.

## API Endpoints

### GET /products
Get all products for authenticated user's business.

**Response**: `List[ProductResponse]`

### POST /products
Create a new product.

**Request Body**: `ProductCreate`
**Response**: `ProductResponse`

### GET /stock
Get all stock items for authenticated user's business.

**Query Parameters**:
- `location` (optional): Filter by location

**Response**: `List[StockItemWithProduct]`

### POST /stock/movement
Record an inventory movement.

**Request Body**: `InventoryMovementCreate`
**Response**: `InventoryMovementResponse`

### GET /products/{product_id}/movements
Get movement history for a specific product.

**Query Parameters**:
- `limit` (optional): Limit results (1-100)

**Response**: `List[InventoryMovementWithProduct]`

## Database Migration

Migration file: `alembic/versions/001_add_inventory_system.py`

To apply:
```bash
make migrate
# or
docker-compose exec backend alembic upgrade head
```

## Usage Example

```python
# Create a product
product_data = ProductCreate(
    name="Rice 1kg",
    sku="RICE-001",
    category="Food",
    unit_of_measure="kg",
    buying_price=50.0,
    selling_price=75.0,
    low_stock_threshold=10.0
)
product = add_product(session, business_id, product_data)

# Record a purchase
movement_data = InventoryMovementCreate(
    product_id=product.id,
    movement_type="purchase_add",
    quantity=100.0,
    reference="PO-2024-001"
)
record_movement(session, product.id, movement_data, user_id)

# Check stock
stock = calculate_stock(session, product.id, "main")
# Returns: 100.0

# Record a sale
sale_movement = InventoryMovementCreate(
    product_id=product.id,
    movement_type="sale",
    quantity=5.0,
    reference="INV-2024-001"
)
record_movement(session, product.id, sale_movement, user_id)

# Check stock again
stock = calculate_stock(session, product.id, "main")
# Returns: 95.0
```


