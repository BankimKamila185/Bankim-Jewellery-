"""
FastAPI application entry point.
Bankim Jewellery Invoice & Product Management System.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback

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
    
    # Validate Google credentials
    if settings.GOOGLE_CREDENTIALS_JSON:
        print("   ✅ GOOGLE_CREDENTIALS_JSON environment variable found")
    elif settings.GOOGLE_CREDENTIALS_PATH:
        from pathlib import Path
        creds_path = Path(settings.GOOGLE_CREDENTIALS_PATH)
        if not creds_path.is_absolute():
            creds_path = Path(__file__).resolve().parent.parent / settings.GOOGLE_CREDENTIALS_PATH
        if creds_path.exists():
            print(f"   ✅ Credentials file found: {creds_path}")
        else:
            print(f"   ⚠️ WARNING: Credentials file not found: {creds_path}")
            print("   ⚠️ Set GOOGLE_CREDENTIALS_JSON env var for production")
    else:
        print("   ⚠️ WARNING: No Google credentials configured!")
    
    if not settings.GOOGLE_SPREADSHEET_ID:
        print("   ⚠️ WARNING: GOOGLE_SPREADSHEET_ID not set!")
    else:
        print(f"   ✅ Spreadsheet ID configured")
    
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


# Global exception handler to ensure CORS headers are included on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions with proper CORS headers."""
    print(f"❌ Unhandled exception: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "error": "Internal Server Error",
            "hint": "Check server logs for details. If this is a credentials error, ensure GOOGLE_CREDENTIALS_JSON is set.",
        },
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
    """Detailed health check with credential validation."""
    from app.dependencies import get_sheets_service, get_drive_service
    
    settings = get_settings()
    sheets_service = get_sheets_service()
    drive_service = get_drive_service()
    
    return {
        "status": "healthy",
        "services": {
            "api": True,
            "google_sheets": sheets_service.service is not None,
            "google_drive": drive_service.service is not None,
            "credentials_configured": bool(settings.GOOGLE_CREDENTIALS_JSON or settings.GOOGLE_CREDENTIALS_PATH),
            "spreadsheet_configured": bool(settings.GOOGLE_SPREADSHEET_ID),
        },
        "config": {
            "cors_origins": settings.CORS_ORIGINS,
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
