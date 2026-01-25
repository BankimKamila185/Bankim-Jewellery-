"""
Payment Pydantic models.
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class PaymentType(str, Enum):
    """Direction of money flow."""
    INCOMING = "IN"   # Received from Customer/Wholesaler
    OUTGOING = "OUT"  # Paid to Supplier/Maker


class RelatedTo(str, Enum):
    """What entity the payment belongs to."""
    INVOICE = "INVOICE"
    PROGRESS = "PROGRESS"


class PaymentMode(str, Enum):
    """Mode of payment."""
    CASH = "Cash"
    UPI = "UPI"
    BANK_TRANSFER = "Bank Transfer"
    CHEQUE = "Cheque"


class PaymentBase(BaseModel):
    """Base payment fields."""
    payment_type: PaymentType
    related_to: RelatedTo
    invoice_id: Optional[str] = None
    progress_id: Optional[str] = None
    dealer_id: str = Field(..., description="Party involved in payment")
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_mode: PaymentMode = Field(default=PaymentMode.CASH)
    reference_no: Optional[str] = None
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment."""
    pass


class Payment(PaymentBase):
    """Complete payment model."""
    payment_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
