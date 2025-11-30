from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, stock, invoice, business, inventory, supplier, purchase, dashboard, quick_sell, activity, profile, analytics, backup, stock_search, stock_analytics, stock_import, payment, expense, cashbook, credit, reports, permissions, invite, staff, branch, pos, sync, stock_take
from app.core.config import settings

app = FastAPI(
    title="SOSY API",
    description="Stock management and invoicing API for Ethiopian micro retail businesses",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stock.router, prefix="/stock", tags=["stock"])
app.include_router(invoice.router, prefix="/invoice", tags=["invoice"])
app.include_router(business.router, prefix="/business", tags=["business"])
app.include_router(inventory.router, prefix="", tags=["inventory"])
app.include_router(supplier.router, prefix="", tags=["suppliers"])
app.include_router(purchase.router, prefix="", tags=["purchase"])
app.include_router(dashboard.router, prefix="", tags=["dashboard"])
app.include_router(quick_sell.router, prefix="", tags=["quick_sell"])
app.include_router(activity.router, prefix="", tags=["activity"])
app.include_router(profile.router, prefix="", tags=["profile"])
app.include_router(analytics.router, prefix="", tags=["analytics"])
app.include_router(backup.router, prefix="", tags=["backup"])
app.include_router(stock_search.router, prefix="", tags=["stock-search"])
app.include_router(stock_analytics.router, prefix="", tags=["stock-analytics"])
app.include_router(stock_import.router, prefix="", tags=["stock-import"])
app.include_router(payment.router, prefix="", tags=["payment"])
app.include_router(expense.router, prefix="", tags=["expense"])
app.include_router(cashbook.router, prefix="", tags=["cashbook"])
app.include_router(credit.router, prefix="", tags=["credit"])
app.include_router(reports.router, prefix="", tags=["reports"])
app.include_router(permissions.router, prefix="", tags=["permissions"])
app.include_router(invite.router, prefix="", tags=["invite"])
app.include_router(staff.router, prefix="", tags=["staff"])
app.include_router(branch.router, prefix="", tags=["branch"])
app.include_router(pos.router, prefix="", tags=["pos"])
app.include_router(sync.router, prefix="", tags=["sync"])
app.include_router(stock_take.router, prefix="", tags=["stocktake"])


@app.get("/")
async def root():
    return {"message": "SOSY API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

