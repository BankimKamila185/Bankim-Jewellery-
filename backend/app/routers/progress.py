"""
Progress Tracking API Router.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.dependencies import get_sheets_service
from app.services.sheets_service import SheetsService
from app.services.workflow_service import WorkflowService
from app.models.workflow import (
    ProductProgress, ProgressCreate, ProgressUpdate, WorkflowStage
)

router = APIRouter(
    prefix="/progress",
    tags=["Workflow & Progress"],
)


def get_workflow_service(sheets_service: SheetsService = Depends(get_sheets_service)) -> WorkflowService:
    return WorkflowService(sheets_service)


@router.get("/stages", response_model=List[WorkflowStage])
async def get_workflow_stages(
    service: WorkflowService = Depends(get_workflow_service)
):
    """Get all workflow stages definition."""
    return await service.get_stages()


@router.post("/start", response_model=ProductProgress)
async def start_process(
    data: ProgressCreate,
    service: WorkflowService = Depends(get_workflow_service)
):
    """Start tracking a variant (Create first stage entry)."""
    try:
        result = await service.start_process(data)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to start process")
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/complete/{progress_id}", response_model=ProductProgress)
async def complete_stage(
    progress_id: str,
    data: ProgressUpdate,
    service: WorkflowService = Depends(get_workflow_service)
):
    """Complete a stage and auto-create the next one."""
    result = await service.complete_stage(progress_id, data)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to complete stage")
    return result


@router.get("/variant/{variant_id}", response_model=List[ProductProgress])
async def get_variant_history(
    variant_id: str,
    sheets_service: SheetsService = Depends(get_sheets_service)
):
    """Get full progress history for a variant."""
    rows = await sheets_service.get_product_progress(variant_id)
    return [ProductProgress(**row) for row in rows]


@router.get("/current/{variant_id}", response_model=ProductProgress)
async def get_current_stage(
    variant_id: str,
    sheets_service: SheetsService = Depends(get_sheets_service)
):
    """Get the current active stage for a variant."""
    current = await sheets_service.get_current_stage(variant_id)
    if not current:
        raise HTTPException(status_code=404, detail="No active stage found")
    return ProductProgress(**current)
