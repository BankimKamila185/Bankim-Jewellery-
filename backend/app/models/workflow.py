"""
Workflow & Progress Pydantic models.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ProgressStatus(str, Enum):
    """Status of a progress entry."""
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"


class WorkflowStage(BaseModel):
    """Definition of a workflow stage."""
    stage_order: int
    stage_code: str
    display_name: str
    is_final_stage: bool = False


class ProductProgressBase(BaseModel):
    """Base fields for progress tracking."""
    variant_id: str
    design_id: Optional[str] = None
    stage_code: str
    assigned_dealer_id: Optional[str] = None
    quantity: int = Field(default=0, ge=0)
    status: ProgressStatus = Field(default=ProgressStatus.PENDING)
    cost: float = Field(default=0.0, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    remarks: Optional[str] = None


class ProgressCreate(BaseModel):
    """Schema for starting a new stage."""
    variant_id: str
    stage_code: str
    assigned_dealer_id: Optional[str] = None
    quantity: int
    remarks: Optional[str] = None
    # Optional cost initialization
    cost: float = 0.0


class ProgressUpdate(BaseModel):
    """Schema for updating/completing a stage."""
    status: Optional[ProgressStatus] = None
    assigned_dealer_id: Optional[str] = None
    cost: Optional[float] = None
    remarks: Optional[str] = None
    end_date: Optional[datetime] = None


class ProductProgress(ProductProgressBase):
    """Complete progress model."""
    progress_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
