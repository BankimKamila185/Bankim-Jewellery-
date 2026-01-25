"""
Plating API Router - Rates and Jobs management.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.dependencies import get_sheets_service
from app.models.plating import (
    PlatingRate,
    PlatingRateCreate,
    PlatingJob,
    PlatingAssignment,
)

router = APIRouter()

# --- Rates ---

@router.get("/rates", response_model=list[PlatingRate])
async def list_rates():
    """List all plating rates."""
    sheets = get_sheets_service()
    return await sheets.get_plating_rates()

@router.post("/rates", response_model=PlatingRate)
async def create_rate(rate: PlatingRateCreate):
    """Create a new plating rate."""
    sheets = get_sheets_service()
    data = rate.model_dump()
    data["plating_type"] = data["plating_type"].value
    
    # Format date to string
    if data.get("effective_from"):
        data["effective_from"] = data["effective_from"].isoformat()
        
    result = await sheets.create_plating_rate(data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create rate")
    return result

@router.put("/rates/{rate_id}")
async def update_rate(rate_id: str, rate: dict): # Simplified dict for update
    """Update a plating rate."""
    sheets = get_sheets_service()
    success = await sheets.update_plating_rate(rate_id, rate)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update rate")
    return {"message": "Rate updated"}

# --- Jobs ---

@router.get("/jobs", response_model=list[PlatingJob])
async def list_jobs(dealer_id: Optional[str] = None):
    """List plating jobs."""
    sheets = get_sheets_service()
    return await sheets.get_plating_jobs(dealer_id)

@router.post("/jobs", response_model=PlatingJob)
async def assign_job(assignment: PlatingAssignment):
    """Assign a new plating job."""
    sheets = get_sheets_service()
    
    # Calculate Cost
    # Find active rate for dealer & type
    rates = await sheets.get_plating_rates()
    # Filter for specific vendor/type
    relevant_rate = next((r for r in rates if r["vendor_dealer_id"] == assignment.dealer_id and r["plating_type"] == assignment.plating_type.value), None)
    
    # If no specific rate, check for general rate? Or fail?
    # For now, if no rate found, default to 0 or error.
    rate_val = 0.0
    if relevant_rate:
        rate_val = float(relevant_rate["rate_per_kg"])
    else:
        # Try finding generic rate
        generic = next((r for r in rates if r["plating_type"] == assignment.plating_type.value and not r.get("vendor_dealer_id")), None)
        if generic:
            rate_val = float(generic["rate_per_kg"])
            
    if rate_val == 0:
         # Optional: Warning or Error. 
         pass

    cost = assignment.weight_in_kg * rate_val
    
    data = {
        "progress_id": "PRG-AUTO", # Placeholder, ideally linked to Workflow
        "variant_id": assignment.variant_id,
        "dealer_id": assignment.dealer_id,
        "plating_type": assignment.plating_type.value,
        "weight_in_kg": assignment.weight_in_kg,
        "rate_per_kg": rate_val,
        "calculated_cost": cost,
        "notes": assignment.notes
    }
    
    result = await sheets.create_plating_job(data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to assign job")
    return result

@router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, status: str):
    """Update job status (InProgress, Completed)."""
    sheets = get_sheets_service()
    success = await sheets.update_plating_job(job_id, {"status": status})
    if not success:
         raise HTTPException(status_code=500, detail="Failed update status")
    return {"message": "Status updated"}
