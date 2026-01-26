"""
Designer Pydantic models for API validation.
Designers are separate from dealers - they handle product design.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr, field_validator


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
    charge_type: Optional[str] = Field(default="PerProduct")
    default_rate: float = Field(default=0.0, ge=0, description="Default design cost")
    specialization: Optional[str] = Field(None, max_length=200, description="Design specialty")
    portfolio: Optional[str] = Field(None, max_length=500, description="Portfolio link")
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="Active", pattern="^(Active|Inactive|Deleted)$")

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        """Convert empty strings to None for email field."""
        if v == "" or v is None:
            return None
        return v
    
    @field_validator("default_rate", mode="before")
    @classmethod
    def empty_rate_to_zero(cls, v: Any) -> float:
        """Convert empty strings to 0 for rate field."""
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except:
            return 0.0


class DesignerCreate(DesignerBase):
    """Schema for creating a new designer."""
    pass


class DesignerUpdate(BaseModel):
    """Schema for updating a designer (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    charge_type: Optional[str] = None
    default_rate: Optional[float] = Field(None, ge=0)
    specialization: Optional[str] = Field(None, max_length=200)
    portfolio: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive|Deleted)$")

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        """Convert empty strings to None for email field."""
        if v == "" or v is None:
            return None
        return v


class Designer(DesignerBase):
    """Complete designer model with auto-generated fields."""
    designer_id: str = Field(..., description="Auto-generated unique ID (DES-XXXXX)")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class DesignerListResponse(BaseModel):
    """Response model for listing designers."""
    total: int
    designers: list[Designer]
