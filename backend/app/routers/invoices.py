"""
Invoices API Router - CRUD operations for invoices.
Supports multiple invoice types and automatic product cost updates.
"""

from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Query

from app.dependencies import get_sheets_service
from app.models.invoice import (
    Invoice,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceListResponse,
    InvoiceType,
    PaymentStatus,
    PaymentCreate,
)


router = APIRouter()


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    invoice_type: Optional[InvoiceType] = Query(None, description="Filter by type"),
    dealer_id: Optional[str] = Query(None, description="Filter by dealer"),
    payment_status: Optional[PaymentStatus] = Query(None, description="Filter by payment status"),
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
):
    """List all invoices with optional filtering."""
    sheets = get_sheets_service()
    invoices = await sheets.get_invoices(
        invoice_type.value if invoice_type else None,
        dealer_id,
    )
    
    # Additional filtering
    if payment_status:
        invoices = [i for i in invoices if i.get("payment_status") == payment_status.value]
    
    if date_from:
        invoices = [
            i for i in invoices
            if i.get("invoice_date") and i["invoice_date"] >= str(date_from)
        ]
    
    if date_to:
        invoices = [
            i for i in invoices
            if i.get("invoice_date") and i["invoice_date"] <= str(date_to)
        ]
    
    return InvoiceListResponse(total=len(invoices), invoices=invoices)


@router.get("/type/{invoice_type}", response_model=InvoiceListResponse)
async def list_invoices_by_type(invoice_type: InvoiceType):
    """Get invoices by type."""
    sheets = get_sheets_service()
    invoices = await sheets.get_invoices(invoice_type.value)
    return InvoiceListResponse(total=len(invoices), invoices=invoices)


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str):
    """Get a single invoice by ID with items."""
    sheets = get_sheets_service()
    invoice = await sheets.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice


@router.post("", response_model=Invoice, status_code=201)
async def create_invoice(invoice: InvoiceCreate):
    """Create a new invoice with items."""
    sheets = get_sheets_service()
    
    # Verify dealer exists
    dealer = await sheets.get_dealer(invoice.dealer_id)
    if not dealer:
        raise HTTPException(status_code=400, detail="Invalid dealer ID")
    
    # Verify all products exist
    # Verify all products/variants exist
    for item in invoice.items:
        is_variant = False
        product = await sheets.get_product(item.product_id)
        
        if not product:
            # Check if it's a variant
            variant = await sheets.get_variant(item.product_id)
            if not variant:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid product/variant ID: {item.product_id}"
                )
            is_variant = True
            
            # Workflow Validation for Sales
            if invoice.invoice_type == InvoiceType.SALES:
                current_stage = await sheets.get_current_stage(item.product_id)
                if not current_stage or current_stage.get("stage_code") != "DELIVERED":
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Variant {item.product_id} cannot be sold. Current stage is not DELIVERED."
                    )
    
    invoice_data = invoice.model_dump(exclude={"items"})
    invoice_data["invoice_type"] = invoice.invoice_type.value
    invoice_data["invoice_date"] = str(invoice.invoice_date)
    if invoice.due_date:
        invoice_data["due_date"] = str(invoice.due_date)
    
    items_data = [item.model_dump() for item in invoice.items]
    
    result = await sheets.create_invoice(invoice_data, items_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create invoice")
    
    return result


@router.put("/{invoice_id}")
async def update_invoice(invoice_id: str, invoice: InvoiceUpdate):
    """Update an existing invoice (limited fields)."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_invoice(invoice_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice.model_dump(exclude_unset=True)
    
    if "due_date" in update_data and update_data["due_date"]:
        update_data["due_date"] = str(update_data["due_date"])
    
    success = await sheets.update_row(
        sheets.SHEETS["invoices"],
        sheets.INVOICE_COLUMNS,
        "invoice_id",
        invoice_id,
        update_data,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update invoice")
    
    return await sheets.get_invoice(invoice_id)


@router.post("/{invoice_id}/payment")
async def record_payment(invoice_id: str, payment: PaymentCreate):
    """Record a payment against an invoice."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_invoice(invoice_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    success = await sheets.record_payment(invoice_id, payment.amount)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to record payment")
    
    return await sheets.get_invoice(invoice_id)


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str):
    """Delete an invoice."""
    sheets = get_sheets_service()
    
    existing = await sheets.get_invoice(invoice_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Soft delete
    success = await sheets.update_row(
        sheets.SHEETS["invoices"],
        sheets.INVOICE_COLUMNS,
        "invoice_id",
        invoice_id,
        {"payment_status": "Cancelled"},
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete invoice")
    
    return {"message": "Invoice deleted successfully"}
