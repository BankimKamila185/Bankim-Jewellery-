"""
FastAPI application entry point.
Bankim Jewellery Invoice & Product Management System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import dealers, designers, invoices, ocr, reports, settings as settings_router
from app.routers import designs, variants, progress, payments, plating, materials


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print("🚀 Starting Bankim Jewellery Invoice System...")
    settings = get_settings()
    print(f"   Version: {settings.APP_VERSION}")
    print(f"   Debug: {settings.DEBUG}")
    yield
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Bankim Jewellery API",
    description="Invoice & Product Management System for Manufacturing + Trading Business",
    version=get_settings().APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware for multi-device access
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(dealers.router, prefix="/api/dealers", tags=["Dealers"])
app.include_router(designers.router, prefix="/api/designers", tags=["Designers"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(variants.router, prefix="/api/variants", tags=["Variants"])
app.include_router(progress.router, prefix="/api/progress")
app.include_router(payments.router, prefix="/api/payments")
app.include_router(plating.router, prefix="/api/plating")
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": get_settings().APP_NAME,
        "version": get_settings().APP_VERSION,
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "services": {
            "api": True,
            "google_sheets": True,  # Will be checked dynamically
            "google_drive": True,   # Will be checked dynamically
            "ocr": True,            # Will be checked dynamically
        }
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
