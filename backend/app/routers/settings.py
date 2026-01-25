"""
Settings API Router - Application settings management.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_sheets_service


router = APIRouter()


class SettingUpdate(BaseModel):
    """Schema for updating a setting."""
    value: str
    category: Optional[str] = "General"


class SettingsResponse(BaseModel):
    """Response with all settings."""
    settings: dict


@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Get all application settings."""
    sheets = get_sheets_service()
    settings = await sheets.get_settings()
    
    # Add default settings if not present
    defaults = {
        "company_name": "Bankim Jewellery",
        "company_address": "",
        "company_phone": "",
        "company_email": "",
        "company_gstin": "",
        "default_tax_percent": "18",
        "invoice_prefix_material": "MAT",
        "invoice_prefix_making": "MKG",
        "invoice_prefix_finishing": "FIN",
        "invoice_prefix_packing": "PKG",
        "invoice_prefix_sales": "SAL",
        "low_stock_threshold": "5",
        "currency_symbol": "₹",
    }
    
    for key, value in defaults.items():
        if key not in settings:
            settings[key] = value
    
    return SettingsResponse(settings=settings)


@router.put("/{key}")
async def update_setting(key: str, setting: SettingUpdate):
    """Update a single setting."""
    sheets = get_sheets_service()
    
    success = await sheets.update_setting(key, setting.value, setting.category)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update setting")
    
    return {"key": key, "value": setting.value, "category": setting.category}


@router.put("")
async def update_settings(settings: dict):
    """Update multiple settings at once."""
    sheets = get_sheets_service()
    
    updated = []
    for key, value in settings.items():
        success = await sheets.update_setting(key, str(value))
        if success:
            updated.append(key)
    
    return {"updated": updated}
