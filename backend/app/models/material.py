"""
Material Pydantic models for Raw Items (e.g., Gold, Silver, Stone).
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class MaterialCategory(str, Enum):
    """Categories for Raw Materials."""
    METAL = "Metal"
    STONE = "Stone"
    CONSUMABLE = "Consumable"  # Solder, Acid, etc.
    PACKING = "Packing"
    OTHER = "Other"

class MaterialUnit(str, Enum):
    """Units of measurement."""
    GRAM = "gm"
    KILOGRAM = "kg"
    PIECE = "pcs"
    CARAT = "ct"

class MaterialPurchaseRequest(BaseModel):
    dealer_id: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    purchase_date: Optional[str] = None # ISO Date
    bill_number: Optional[str] = None
    notes: Optional[str] = None

class MaterialBase(BaseModel):
    """Base material fields."""
    name: str = Field(..., min_length=1, max_length=200, description="Material Name")
    category: MaterialCategory = Field(default=MaterialCategory.METAL)
    unit: MaterialUnit = Field(default=MaterialUnit.GRAM)
    
    current_stock: float = Field(default=0.0, ge=0, description="Current stock quantity")
    min_stock_alert: float = Field(default=0.0, ge=0)
    
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")

class MaterialCreate(MaterialBase):
    """Schema for creating a new material."""
    pass

class MaterialUpdate(BaseModel):
    """Schema for updating a material."""
    name: Optional[str] = None
    category: Optional[MaterialCategory] = None
    unit: Optional[MaterialUnit] = None
    min_stock_alert: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class Material(MaterialBase):
    """Complete material model."""
    material_id: str = Field(..., description="Unique ID (MAT-XXXXX)")
    last_purchase_price: float = Field(default=0.0, description="Last known purchase price (for ref)")
    last_purchase_date: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True

class MaterialListResponse(BaseModel):
    total: int
    materials: list[Material]
