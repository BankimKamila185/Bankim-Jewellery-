"""
Designers API Router - CRUD operations for designers.
Designers are separate from dealers and handle product design.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.dependencies import get_sheets_service
from app.models.designer import (
    Designer,
    DesignerCreate,
    DesignerUpdate,
    DesignerListResponse,
    ChargeType,
)


router = APIRouter()


@router.get("", response_model=DesignerListResponse)
async def list_designers(
    status: str = Query("Active", description="Filter by status"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
):
    """List all designers with optional filtering."""
    sheets = get_sheets_service()
    designers = await sheets.get_designers()
    
    # Additional filtering
    if status:
        designers = [d for d in designers if d.get("status") == status]
    if specialization:
        designers = [
            d for d in designers
            if specialization.lower() in (d.get("specialization") or "").lower()
        ]
    
    return DesignerListResponse(total=len(designers), designers=designers)


@router.get("/{designer_id}")
async def get_designer(designer_id: str):
    """Get a single designer by ID."""
    sheets = get_sheets_service()
    designer = await sheets.get_designer(designer_id)
    
    if not designer:
        raise HTTPException(status_code=404, detail="Designer not found")
    
    return designer


@router.post("", response_model=Designer, status_code=201)
async def create_designer(designer: DesignerCreate):
    """Create a new designer."""
    sheets = get_sheets_service()
    
    designer_data = designer.model_dump()
    designer_data["charge_type"] = designer.charge_type.value
    
    result = await sheets.create_designer(designer_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create designer")
    
    return result


@router.put("/{designer_id}")
async def update_designer(designer_id: str, designer: DesignerUpdate):
    """Update an existing designer."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_designer(designer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Designer not found")
    
    update_data = designer.model_dump(exclude_unset=True)
    
    if "charge_type" in update_data and update_data["charge_type"]:
        update_data["charge_type"] = update_data["charge_type"].value
    
    success = await sheets.update_designer(designer_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update designer")
    
    return await sheets.get_designer(designer_id)


@router.delete("/{designer_id}")
async def delete_designer(designer_id: str):
    """Delete a designer (soft delete)."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_designer(designer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Designer not found")
    
    success = await sheets.delete_designer(designer_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete designer")
    
    return {"message": "Designer deleted successfully"}
