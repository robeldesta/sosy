from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, stock, invoice, business
from app.core.config import settings

app = FastAPI(
    title="SOSY API",
    description="Stock management and invoicing API for Ethiopian micro retail businesses",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stock.router, prefix="/stock", tags=["stock"])
app.include_router(invoice.router, prefix="/invoice", tags=["invoice"])
app.include_router(business.router, prefix="/business", tags=["business"])


@app.get("/")
async def root():
    return {"message": "SOSY API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

