"""
Design Pydantic models for API validation.
Represents a master design that can have multiple variants.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DesignStatus(str, Enum):
    """Design availability status."""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    ARCHIVED = "Archived"


class DesignBase(BaseModel):
    """Base design fields."""
    name: str = Field(..., min_length=1, max_length=200, description="Design name")
    category: str = Field(..., min_length=1, max_length=100, description="Category (e.g. Mukut, Necklace)")
    designer_id: Optional[str] = Field(None, description="Linked designer ID")
    base_design_cost: float = Field(default=0.0, ge=0, description="Base design cost used for variants")
    notes: Optional[str] = Field(None, max_length=1000)
    status: DesignStatus = Field(default=DesignStatus.ACTIVE)


class DesignCreate(DesignBase):
    """Schema for creating a new design."""
    image_drive_link: Optional[str] = Field(None, description="Main design image URL")
    spec_doc_link: Optional[str] = Field(None, description="Google Docs specs URL")


class DesignUpdate(BaseModel):
    """Schema for updating a design."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    designer_id: Optional[str] = None
    base_design_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[DesignStatus] = None
    image_drive_link: Optional[str] = None
    spec_doc_link: Optional[str] = None


class Design(DesignBase):
    """Complete design model."""
    design_id: str = Field(..., description="Unique ID (DES-AM-001)")
    
    # Links
    image_drive_link: Optional[str] = Field(None, description="Main design image URL")
    spec_doc_link: Optional[str] = Field(None, description="Google Docs specs URL")
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class DesignListResponse(BaseModel):
    """Response model for listing designs."""
    total: int
    designs: list[Design]
