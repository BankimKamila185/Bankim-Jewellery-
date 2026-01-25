"""
Dealer Pydantic models for API validation.
Supports both BUY (suppliers) and SELL (customers) dealers.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr, field_validator


class DealerType(str, Enum):
    """Dealer type - determines money flow direction."""
    BUY = "BUY"    # Money goes out (suppliers, vendors)
    SELL = "SELL"  # Money comes in (customers)


class DealerCategory(str, Enum):
    """Categories for BUY dealers."""
    MATERIAL = "Material"      # Raw material suppliers
    MAKING = "Making"          # Labour/making vendors
    PLATING = "Plating"        # Gold/silver plating
    PACKING = "Packing"        # Packing vendors
    CUSTOMER = "Customer"      # For SELL dealers


class DealerBase(BaseModel):
    """Base dealer fields."""
    name: str = Field(..., min_length=1, max_length=200, description="Dealer/Company name")
    dealer_type: DealerType = Field(..., description="BUY or SELL")
    dealer_category: DealerCategory = Field(..., description="Category of dealer")
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=500)
    gstin: Optional[str] = Field(None, max_length=20, description="GST Number")
    bank_name: Optional[str] = Field(None, max_length=100)
    account_no: Optional[str] = Field(None, max_length=30)
    ifsc: Optional[str] = Field(None, max_length=15)
    opening_balance: float = Field(default=0.0, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="Active", pattern="^(Active|Inactive|Deleted)$")

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        """Convert empty strings to None for email field."""
        if v == "" or v is None:
            return None
        return v
    
    @field_validator("opening_balance", mode="before")
    @classmethod
    def empty_balance_to_zero(cls, v: Any) -> float:
        """Convert empty strings to 0 for balance field."""
        if v == "" or v is None:
            return 0.0
        return float(v)


class DealerCreate(DealerBase):
    """Schema for creating a new dealer."""
    pass


class DealerUpdate(BaseModel):
    """Schema for updating a dealer (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    dealer_type: Optional[DealerType] = None
    dealer_category: Optional[DealerCategory] = None
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=500)
    gstin: Optional[str] = Field(None, max_length=20)
    bank_name: Optional[str] = Field(None, max_length=100)
    account_no: Optional[str] = Field(None, max_length=30)
    ifsc: Optional[str] = Field(None, max_length=15)
    opening_balance: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive|Deleted)$")

    @field_validator("email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        """Convert empty strings to None for email field."""
        if v == "" or v is None:
            return None
        return v


class Dealer(DealerBase):
    """Complete dealer model with auto-generated fields."""
    dealer_id: str = Field(..., description="Auto-generated unique ID (DLR-XXXXX)")
    dealer_code: str = Field(..., description="Unique dealer code (MAT-0001, CUS-0001)")
    current_balance: float = Field(default=0.0, description="Calculated current balance")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @field_validator("current_balance", mode="before")
    @classmethod
    def empty_balance_to_zero(cls, v: Any) -> float:
        """Convert empty strings to 0 for balance field."""
        if v == "" or v is None:
            return 0.0
        return float(v)

    class Config:
        from_attributes = True


class DealerListResponse(BaseModel):
    """Response model for listing dealers."""
    total: int
    dealers: list[Dealer]

