"""
Invoice Pydantic models for API validation.
Supports multiple invoice types: Material, Making, Finishing, Packing, Sales.
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class InvoiceType(str, Enum):
    """Types of invoices supported."""
    MATERIAL = "Material"      # Raw material purchase
    MAKING = "Making"          # Job work / labour
    FINISHING = "Finishing"    # Gold/silver plating
    PACKING = "Packing"        # Packing costs
    SALES = "Sales"            # Sales to customers


class PaymentStatus(str, Enum):
    """Invoice payment status."""
    PAID = "Paid"
    PARTIAL = "Partial"
    UNPAID = "Unpaid"


class InvoiceItemBase(BaseModel):
    """Base invoice item fields."""
    product_id: str = Field(..., description="Linked product ID")
    description: Optional[str] = Field(None, max_length=500)
    quantity: float = Field(..., gt=0, description="Quantity")
    unit_price: float = Field(..., ge=0, description="Price per unit")
    notes: Optional[str] = Field(None, max_length=500)


class InvoiceItemCreate(InvoiceItemBase):
    """Schema for creating an invoice item."""
    pass


class InvoiceItem(InvoiceItemBase):
    """Complete invoice item model."""
    item_id: str = Field(..., description="Auto-generated unique ID")
    invoice_id: str = Field(..., description="Parent invoice ID")
    total_price: float = Field(..., ge=0, description="Quantity × Unit Price")
    cost_type: InvoiceType = Field(..., description="Type of cost for this item")

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    """Base invoice fields."""
    invoice_type: InvoiceType = Field(..., description="Type of invoice")
    dealer_id: str = Field(..., description="Linked dealer ID")
    invoice_date: date = Field(default_factory=date.today)
    due_date: Optional[date] = None
    tax_percent: float = Field(default=0.0, ge=0, le=100)
    discount_percent: float = Field(default=0.0, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=1000)


class InvoiceCreate(InvoiceBase):
    """Schema for creating a new invoice."""
    items: list[InvoiceItemCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice (limited fields)."""
    due_date: Optional[date] = None
    tax_percent: Optional[float] = Field(None, ge=0, le=100)
    discount_percent: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=1000)


class PaymentCreate(BaseModel):
    """Schema for recording a payment against an invoice."""
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_date: date = Field(default_factory=date.today)
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class Invoice(InvoiceBase):
    """Complete invoice model with auto-calculated fields."""
    invoice_id: str = Field(..., description="Auto-generated unique ID (INV-XXXXX)")
    invoice_number: str = Field(..., description="Display invoice number (MAT-2024-001)")
    
    # Auto-calculated amounts
    sub_total: float = Field(default=0.0, ge=0, description="Sum of item totals")
    tax_amount: float = Field(default=0.0, ge=0, description="Calculated tax")
    discount_amount: float = Field(default=0.0, ge=0, description="Calculated discount")
    grand_total: float = Field(default=0.0, ge=0, description="Final total")
    amount_paid: float = Field(default=0.0, ge=0, description="Amount already paid")
    balance_due: float = Field(default=0.0, ge=0, description="Remaining balance")
    
    payment_status: PaymentStatus = Field(default=PaymentStatus.UNPAID)
    bill_image_link: Optional[str] = Field(None, description="Scanned bill image URL")
    
    # Nested items
    items: list[InvoiceItem] = []
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    """Response model for listing invoices."""
    total: int
    invoices: list[Invoice]


class InvoiceSummary(BaseModel):
    """Summary view of invoice (for lists)."""
    invoice_id: str
    invoice_number: str
    invoice_type: InvoiceType
    dealer_id: str
    dealer_name: str
    invoice_date: date
    grand_total: float
    balance_due: float
    payment_status: PaymentStatus
