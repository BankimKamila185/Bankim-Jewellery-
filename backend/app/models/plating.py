"""
Plating Pydantic models.
"""

from datetime import datetime, date
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field


class PlatingType(str, Enum):
    B_GOLD = "B_GOLD"
    LAKE_GOLD = "LAKE_GOLD"
    OTHER = "OTHER"


class JobStatus(str, Enum):
    ASSIGNED = "Assigned"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"


class PlatingRateBase(BaseModel):
    plating_type: PlatingType
    rate_per_kg: float = Field(..., gt=0)
    unit: str = "KG"
    effective_from: date = Field(default_factory=date.today)
    vendor_dealer_id: Optional[str] = None
    status: str = "Active"


class PlatingRateCreate(PlatingRateBase):
    pass


class PlatingRate(PlatingRateBase):
    rate_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlatingAssignment(BaseModel):
    variant_id: str
    design_id: Optional[str] = None
    dealer_id: str
    quantity: int = Field(..., gt=0)
    plating_type: PlatingType
    weight_in_kg: float = Field(..., gt=0)
    notes: Optional[str] = None


class PlatingJob(BaseModel):
    job_id: str
    progress_id: str
    variant_id: str
    dealer_id: str
    quantity: int
    plating_type: str
    weight_in_kg: float
    rate_per_kg: float
    calculated_cost: float
    status: JobStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
