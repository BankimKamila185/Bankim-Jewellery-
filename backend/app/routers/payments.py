"""
Payments API Router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from app.dependencies import get_sheets_service
from app.services.sheets_service import SheetsService
from app.services.payment_service import PaymentService
from app.models.payment import Payment, PaymentCreate

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


def get_payment_service(sheets_service: SheetsService = Depends(get_sheets_service)) -> PaymentService:
    return PaymentService(sheets_service)


@router.post("", response_model=Payment)
async def create_payment(
    data: PaymentCreate,
    service: PaymentService = Depends(get_payment_service)
):
    """Create a new payment."""
    try:
        result = await service.create_payment(data)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create payment")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invoice/{invoice_id}", response_model=List[Payment])
async def get_invoice_payments(
    invoice_id: str,
    service: PaymentService = Depends(get_payment_service)
):
    """Get history for an invoice."""
    return await service.get_payments(invoice_id=invoice_id)


@router.get("/dealer/{dealer_id}", response_model=List[Payment])
async def get_dealer_payments(
    dealer_id: str,
    service: PaymentService = Depends(get_payment_service)
):
    """Get history for a dealer."""
    return await service.get_payments(dealer_id=dealer_id)


@router.get("/progress/{progress_id}", response_model=List[Payment])
async def get_stage_payments(
    progress_id: str,
    service: PaymentService = Depends(get_payment_service)
):
    """Get history for a workflow stage."""
    return await service.get_payments(progress_id=progress_id)
