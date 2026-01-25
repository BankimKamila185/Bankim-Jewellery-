"""
Product Variant Pydantic models for API validation.
Represents a specific physical variation of a Design.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class VariantStatus(str, Enum):
    """Variant availability status."""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    OUT_OF_STOCK = "Out of Stock"


class FinishType(str, Enum):
    """Finish types for jewellery."""
    GOLD = "Gold"
    SILVER = "Silver"
    MIX = "Mix"
    ANTIQUE = "Antique"
    ROSE_GOLD = "Rose Gold"
    OTHER = "Other"


class VariantBase(BaseModel):
    """Base variant fields."""
    design_id: str = Field(..., description="Parent Design ID")
    variant_code: str = Field(..., description="Unique Variant Code (e.g. AM001)")
    size: Optional[str] = Field(None, max_length=50, description="Size specification")
    finish: FinishType = Field(default=FinishType.GOLD)
    
    # Costs (Input)
    material_cost: float = Field(default=0.0, ge=0)
    making_cost: float = Field(default=0.0, ge=0)
    finishing_cost: float = Field(default=0.0, ge=0)
    packing_cost: float = Field(default=0.0, ge=0)
    design_cost: float = Field(default=0.0, ge=0, description="Allocated design cost")
    
    # selling_price REMOVED - Price is only in Invoices
    stock_qty: int = Field(default=0, ge=0)
    
    notes: Optional[str] = Field(None, max_length=1000)
    status: VariantStatus = Field(default=VariantStatus.ACTIVE)


class VariantCreate(VariantBase):
    """Schema for creating a new variant."""
    image_drive_link: Optional[str] = None


class VariantUpdate(BaseModel):
    """Schema for updating a variant."""
    variant_code: Optional[str] = None
    size: Optional[str] = None
    finish: Optional[FinishType] = None
    
    material_cost: Optional[float] = Field(None, ge=0)
    making_cost: Optional[float] = Field(None, ge=0)
    finishing_cost: Optional[float] = Field(None, ge=0)
    packing_cost: Optional[float] = Field(None, ge=0)
    design_cost: Optional[float] = Field(None, ge=0)
    
    selling_price: Optional[float] = Field(None, ge=0)
    stock_qty: Optional[int] = Field(None, ge=0)
    
    image_drive_link: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[VariantStatus] = None


class Variant(VariantBase):
    """Complete variant model with calculated fields."""
    variant_id: str = Field(..., description="Unique ID")
    
    # Auto-calculated
    final_cost: float = Field(default=0.0, description="Sum of all costs")
    profit: float = Field(default=0.0, description="Selling Price - Final Cost")
    profit_margin: float = Field(default=0.0, description="Profit percentage")
    
    image_drive_link: Optional[str] = Field(None, description="Variant image URL")
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class VariantListResponse(BaseModel):
    """Response model for listing variants."""
    total: int
    variants: list[Variant]
