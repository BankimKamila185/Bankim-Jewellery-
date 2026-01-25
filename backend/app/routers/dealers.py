"""
Dealers API Router - CRUD operations for dealers.
Supports both BUY (suppliers) and SELL (customers) dealers.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.dependencies import get_sheets_service
from app.models.dealer import (
    Dealer,
    DealerCreate,
    DealerUpdate,
    DealerListResponse,
    DealerType,
    DealerCategory,
)
from app.services.code_generator import CodeGenerator


router = APIRouter()


@router.get("", response_model=DealerListResponse)
async def list_dealers(
    dealer_type: Optional[DealerType] = Query(None, description="Filter by BUY or SELL"),
    category: Optional[DealerCategory] = Query(None, description="Filter by category"),
    status: str = Query("Active", description="Filter by status"),
):
    """List all dealers with optional filtering."""
    sheets = get_sheets_service()
    dealers = await sheets.get_dealers(dealer_type.value if dealer_type else None)
    
    # Additional filtering
    if category:
        dealers = [d for d in dealers if d.get("dealer_category") == category.value]
    if status:
        dealers = [d for d in dealers if d.get("status") == status]
    
    return DealerListResponse(total=len(dealers), dealers=dealers)


@router.get("/code/generate")
async def generate_dealer_code(
    dealer_type: DealerType = Query(..., description="BUY or SELL"),
    category: DealerCategory = Query(..., description="Dealer category"),
):
    """Generate a unique dealer code based on type and category."""
    sheets = get_sheets_service()
    dealers = await sheets.get_dealers()
    existing_codes = [d.get("dealer_code", "") for d in dealers]
    
    code = CodeGenerator.generate_dealer_code(
        dealer_type.value,
        category.value,
        existing_codes,
    )
    
    return {"dealer_code": code}


@router.get("/type/{dealer_type}", response_model=DealerListResponse)
async def list_dealers_by_type(dealer_type: DealerType):
    """Get dealers by type (BUY or SELL)."""
    sheets = get_sheets_service()
    dealers = await sheets.get_dealers(dealer_type.value)
    return DealerListResponse(total=len(dealers), dealers=dealers)


@router.get("/{dealer_id}")
async def get_dealer(dealer_id: str):
    """Get a single dealer by ID."""
    sheets = get_sheets_service()
    dealer = await sheets.get_dealer(dealer_id)
    
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    
    return dealer


@router.post("", response_model=Dealer, status_code=201)
async def create_dealer(dealer: DealerCreate):
    """Create a new dealer."""
    sheets = get_sheets_service()
    
    # Get existing codes and generate new one
    dealers = await sheets.get_dealers()
    existing_codes = [d.get("dealer_code", "") for d in dealers]
    
    dealer_code = CodeGenerator.generate_dealer_code(
        dealer.dealer_type.value,
        dealer.dealer_category.value,
        existing_codes,
    )
    
    dealer_data = dealer.model_dump()
    dealer_data["dealer_code"] = dealer_code
    dealer_data["dealer_type"] = dealer.dealer_type.value
    dealer_data["dealer_category"] = dealer.dealer_category.value
    
    result = await sheets.create_dealer(dealer_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create dealer")
    
    return result


@router.put("/{dealer_id}")
async def update_dealer(dealer_id: str, dealer: DealerUpdate):
    """Update an existing dealer."""
    sheets = get_sheets_service()
    
    # Check dealer exists
    existing = await sheets.get_dealer(dealer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Dealer not found")
    
    # Only update non-None fields
    update_data = dealer.model_dump(exclude_unset=True)
    
    # Convert enums to values
    if "dealer_type" in update_data and update_data["dealer_type"]:
        update_data["dealer_type"] = update_data["dealer_type"].value
    if "dealer_category" in update_data and update_data["dealer_category"]:
        update_data["dealer_category"] = update_data["dealer_category"].value
    
    success = await sheets.update_dealer(dealer_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update dealer")
    
    return await sheets.get_dealer(dealer_id)


@router.delete("/{dealer_id}")
async def delete_dealer(dealer_id: str):
    """Delete a dealer (soft delete - sets status to Deleted)."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_dealer(dealer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Dealer not found")
    
    success = await sheets.delete_dealer(dealer_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete dealer")
    
    return {"message": "Dealer deleted successfully"}
