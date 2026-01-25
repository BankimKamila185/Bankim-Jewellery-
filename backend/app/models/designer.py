"""
Designer Pydantic models for API validation.
Designers are separate from dealers - they handle product design.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class ChargeType(str, Enum):
    """How designer charges for their work."""
    FIXED = "Fixed"           # Fixed fee per project
    PER_PRODUCT = "PerProduct"  # Fee per product designed


class DesignerBase(BaseModel):
    """Base designer fields."""
    name: str = Field(..., min_length=1, max_length=200, description="Designer name")
    company: Optional[str] = Field(None, max_length=200, description="Studio/Company name")
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    charge_type: ChargeType = Field(default=ChargeType.PER_PRODUCT)
    default_rate: float = Field(default=0.0, ge=0, description="Default design cost")
    specialization: Optional[str] = Field(None, max_length=200, description="Design specialty")
    portfolio: Optional[str] = Field(None, max_length=500, description="Portfolio link")
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")


class DesignerCreate(DesignerBase):
    """Schema for creating a new designer."""
    pass


class DesignerUpdate(BaseModel):
    """Schema for updating a designer (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    charge_type: Optional[ChargeType] = None
    default_rate: Optional[float] = Field(None, ge=0)
    specialization: Optional[str] = Field(None, max_length=200)
    portfolio: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive)$")


class Designer(DesignerBase):
    """Complete designer model with auto-generated fields."""
    designer_id: str = Field(..., description="Auto-generated unique ID (DES-XXXXX)")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class DesignerListResponse(BaseModel):
    """Response model for listing designers."""
    total: int
    designers: list[Designer]
