"""
OCR API Router - Bill scanning and text extraction.
Uses phone camera to scan physical bills.
"""

import base64
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_ocr_service, get_drive_service


router = APIRouter()


class ScanRequest(BaseModel):
    """Request body for base64 image scanning."""
    image_base64: str
    filename: Optional[str] = "scanned_bill.jpg"


class ParsedBillItem(BaseModel):
    """Parsed line item from bill."""
    description: str
    quantity: float
    rate: float
    amount: float


class ParsedBillResponse(BaseModel):
    """Response with parsed bill data."""
    dealer_name: Optional[str]
    date: Optional[str]
    items: list[ParsedBillItem]
    subtotal: Optional[float]
    tax: Optional[float]
    total: Optional[float]
    raw_text: str


@router.post("/scan", response_model=ParsedBillResponse)
async def scan_bill(request: ScanRequest):
    """Scan a bill image (base64) and extract text."""
    ocr = get_ocr_service()
    
    if not ocr.available:
        raise HTTPException(
            status_code=503,
            detail="OCR service not available. Please install Tesseract."
        )
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.image_base64)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 image: {str(e)}"
        )
    
    # Process image and parse text
    result = await ocr.scan_and_parse(image_bytes)
    
    # Convert items to proper format
    items = [
        ParsedBillItem(
            description=item.get("description", ""),
            quantity=item.get("quantity", 0),
            rate=item.get("rate", 0),
            amount=item.get("amount", 0),
        )
        for item in result.get("items", [])
    ]
    
    return ParsedBillResponse(
        dealer_name=result.get("dealer_name"),
        date=result.get("date"),
        items=items,
        subtotal=result.get("subtotal"),
        tax=result.get("tax"),
        total=result.get("total"),
        raw_text=result.get("raw_text", ""),
    )


@router.post("/scan/file", response_model=ParsedBillResponse)
async def scan_bill_file(file: UploadFile = File(..., description="Bill image file")):
    """Scan a bill image (file upload) and extract text."""
    ocr = get_ocr_service()
    
    if not ocr.available:
        raise HTTPException(
            status_code=503,
            detail="OCR service not available. Please install Tesseract."
        )
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
        )
    
    # Read file content
    image_bytes = await file.read()
    
    # Process image and parse text
    result = await ocr.scan_and_parse(image_bytes)
    
    items = [
        ParsedBillItem(
            description=item.get("description", ""),
            quantity=item.get("quantity", 0),
            rate=item.get("rate", 0),
            amount=item.get("amount", 0),
        )
        for item in result.get("items", [])
    ]
    
    return ParsedBillResponse(
        dealer_name=result.get("dealer_name"),
        date=result.get("date"),
        items=items,
        subtotal=result.get("subtotal"),
        tax=result.get("tax"),
        total=result.get("total"),
        raw_text=result.get("raw_text", ""),
    )


@router.post("/upload")
async def upload_scanned_bill(
    invoice_id: str,
    file: UploadFile = File(..., description="Scanned bill image"),
):
    """Upload a scanned bill image to Google Drive."""
    drive = get_drive_service()
    
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
        )
    
    content = await file.read()
    
    view_link = await drive.upload_invoice_image(
        invoice_id,
        content,
        file.filename,
        file.content_type,
    )
    
    if not view_link:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    return {"image_url": view_link}


@router.get("/status")
async def ocr_status():
    """Check if OCR service is available."""
    ocr = get_ocr_service()
    
    return {
        "available": ocr.available,
        "language": ocr.lang,
    }
