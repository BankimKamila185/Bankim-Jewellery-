"""
Configuration settings for the application.
Uses environment variables for sensitive data.
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Bankim Jewellery Invoice System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS - Allow all origins for local network access
    CORS_ORIGINS: list[str] = ["*"]
    
    # Google API Settings
    GOOGLE_CREDENTIALS_PATH: str = "credentials/service_account.json"
    GOOGLE_SPREADSHEET_ID: str = ""  # Set in .env
    
    # Google Drive Folder IDs (set after creating folders)
    DRIVE_PRODUCTS_FOLDER_ID: str = ""
    DRIVE_INVOICES_FOLDER_ID: str = ""
    DRIVE_SPECS_FOLDER_ID: str = ""
    
    # OCR Settings
    TESSERACT_CMD: str = ""  # Path to tesseract executable (auto-detect if empty)
    OCR_LANG: str = "eng+hin"  # English + Hindi
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
CREDENTIALS_DIR = BASE_DIR / "credentials"
TEMP_DIR = BASE_DIR / "temp"

# Ensure directories exist
CREDENTIALS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)
