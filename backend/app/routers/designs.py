"""
Designs API Router - CRUD operations for designs.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends

# Dependencies
from app.dependencies import get_sheets_service
from app.services.sheets_service import SheetsService

# Models
from app.models.design import (
    Design,
    DesignCreate,
    DesignUpdate,
    DesignListResponse,
    DesignStatus,
)
from app.models.variant import Variant

router = APIRouter()


@router.get("", response_model=DesignListResponse)
async def list_designs(
    status: Optional[DesignStatus] = Query(None, description="Filter by status"),
    sheets: SheetsService = Depends(get_sheets_service),
):
    """List all designs with optional filtering."""
    designs = await sheets.get_designs()
    
    if status:
        designs = [d for d in designs if d.get("status") == status.value]
    
    return DesignListResponse(total=len(designs), designs=designs)


@router.get("/{design_id}")
async def get_design(
    design_id: str,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Get a single design by ID."""
    design = await sheets.get_design(design_id)
    
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    return design


@router.post("", response_model=Design, status_code=201)
async def create_design(
    design: DesignCreate,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Create a new design."""
    design_data = design.model_dump()
    design_data["status"] = design.status.value if design.status else "Active"
    
    result = await sheets.create_design(design_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create design")
    
    return result


@router.put("/{design_id}")
async def update_design(
    design_id: str,
    design: DesignUpdate,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Update an existing design."""
    existing = await sheets.get_design(design_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Design not found")
    
    update_data = design.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value
    
    success = await sheets.update_design(design_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update design")
    
    return await sheets.get_design(design_id)


@router.delete("/{design_id}")
async def delete_design(
    design_id: str,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """Delete a design (soft delete)."""
    existing = await sheets.get_design(design_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Design not found")
    
    success = await sheets.delete_design(design_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete design")
    
    return {"message": "Design deleted successfully"}


@router.get("/{design_id}/variants", response_model=list[Variant])
async def list_design_variants(
    design_id: str,
    sheets: SheetsService = Depends(get_sheets_service),
):
    """List all variants for a specific design."""
    # Verify design exists
    design = await sheets.get_design(design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
        
    variants = await sheets.get_variants(design_id=design_id)
    return variants
