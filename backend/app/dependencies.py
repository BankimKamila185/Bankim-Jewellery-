"""
Dependency injection for FastAPI routes.
Provides service instances to route handlers.
"""

from functools import lru_cache
from fastapi import Depends

from app.config import get_settings, Settings
from app.services.sheets_service import SheetsService
from app.services.drive_service import DriveService
from app.services.ocr_service import OCRService
from app.services.cache_service import CacheService


@lru_cache()
def get_cache_service() -> CacheService:
    """Get cached CacheService instance."""
    return CacheService(default_ttl=300, max_size=1000)


@lru_cache()
def get_sheets_service() -> SheetsService:
    """Get cached Google Sheets service instance."""
    settings = get_settings()
    cache = get_cache_service()
    return SheetsService(
        credentials_path=settings.GOOGLE_CREDENTIALS_PATH,
        spreadsheet_id=settings.GOOGLE_SPREADSHEET_ID,
        credentials_json=settings.GOOGLE_CREDENTIALS_JSON,
        cache_service=cache
    )


@lru_cache()
def get_drive_service() -> DriveService:
    """Get cached Google Drive service instance."""
    settings = get_settings()
    return DriveService(
        credentials_path=settings.GOOGLE_CREDENTIALS_PATH,
        products_folder_id=settings.DRIVE_PRODUCTS_FOLDER_ID,
        invoices_folder_id=settings.DRIVE_INVOICES_FOLDER_ID,
        specs_folder_id=settings.DRIVE_SPECS_FOLDER_ID,
        credentials_json=settings.GOOGLE_CREDENTIALS_JSON
    )


@lru_cache()
def get_ocr_service() -> OCRService:
    """Get cached OCR service instance."""
    settings = get_settings()
    return OCRService(
        tesseract_cmd=settings.TESSERACT_CMD,
        lang=settings.OCR_LANG,
    )


# Type aliases for cleaner dependency injection
SheetsServiceDep = Depends(get_sheets_service)
DriveServiceDep = Depends(get_drive_service)
OCRServiceDep = Depends(get_ocr_service)
CacheServiceDep = Depends(get_cache_service)
