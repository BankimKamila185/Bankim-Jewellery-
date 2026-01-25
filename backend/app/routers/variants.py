"""
Variants API Router - CRUD operations for product variants.
Includes image upload and cost calculation.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends

# Dependencies
from app.dependencies import get_sheets_service, get_drive_service
from app.services.sheets_service import SheetsService
from app.services.drive_service import DriveService

# Models
from app.models.variant import (
    Variant,
    VariantCreate,
    VariantUpdate,
    VariantListResponse,
    VariantStatus,
    FinishType,
)

router = APIRouter()


@router.get("", response_model=VariantListResponse)
async def list_variants(
    design_id: Optional[str] = Query(None, description="Filter by design ID"),
    finish: Optional[FinishType] = Query(None, description="Filter by finish"),
    status: Optional[VariantStatus] = Query(None, description="Filter by status"),
    sheets: SheetsService = Depends(get_sheets_service),
):
    """List all variants with optional filtering."""
    variants = await sheets.get_variants(design_id)
    
    if finish:
        variants = [v for v in variants if v.get("finish") == finish.value]
    
    if status:
        variants = [v for v in variants if v.get("status") == status.value]
    
    return VariantListResponse(total=len(variants), variants=variants)


@router.get("/{variant_id}")
async def get_variant(
    variant_id: str,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Get a single variant by ID."""
    variant = await sheets.get_variant(variant_id)
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    return variant


@router.post("", response_model=Variant, status_code=201)
async def create_variant(
    variant: VariantCreate,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Create a new variant."""
    # Verify design exists
    design = await sheets.get_design(variant.design_id)
    if not design:
        raise HTTPException(status_code=404, detail=f"Design {variant.design_id} not found")
    
    variant_data = variant.model_dump()
    variant_data["status"] = variant.status.value if variant.status else "Active"
    
    # Ensure finish is string
    if variant.finish:
        variant_data["finish"] = variant.finish.value
        
    result = await sheets.create_variant(variant_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create variant")
    
    return result


@router.put("/{variant_id}")
async def update_variant(
    variant_id: str,
    variant: VariantUpdate,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Update an existing variant."""
    existing = await sheets.get_variant(variant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    update_data = variant.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value
        
    if "finish" in update_data and update_data["finish"]:
        update_data["finish"] = update_data["finish"].value
    
    success = await sheets.update_variant(variant_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update variant")
    
    return await sheets.get_variant(variant_id)


@router.delete("/{variant_id}")
async def delete_variant(
    variant_id: str,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Delete a variant (soft delete)."""
    existing = await sheets.get_variant(variant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    success = await sheets.delete_variant(variant_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete variant")
    
    return {"message": "Variant deleted successfully"}


@router.post("/{variant_id}/image")
async def upload_variant_image(
    variant_id: str,
    file: UploadFile = File(..., description="Variant image file"),
    sheets: SheetsService = Depends(get_sheets_service),
    drive: DriveService = Depends(get_drive_service),
):
    """Upload a variant image to Google Drive."""
    variant = await sheets.get_variant(variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
        )
    
    # Read file content
    content = await file.read()
    
    # Upload to Drive
    view_link = await drive.upload_variant_image(
        variant_id,
        content,
        file.filename,
        file.content_type,
    )
    
    if not view_link:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    # Update variant with image link
    await sheets.update_variant(variant_id, {"image_drive_link": view_link})
    
    return {"image_url": view_link}
