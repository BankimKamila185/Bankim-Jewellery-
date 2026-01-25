"""
OCR Service - Extract text from scanned bills using Tesseract.
Includes preprocessing for better accuracy.
"""

import io
import re
import subprocess
from datetime import datetime
from typing import Optional
from pathlib import Path

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


class OCRService:
    """Service for OCR text extraction using Tesseract."""
    
    def __init__(self, tesseract_cmd: str = "", lang: str = "eng+hin"):
        """Initialize OCR service."""
        self.lang = lang
        self.available = TESSERACT_AVAILABLE
        
        if TESSERACT_AVAILABLE:
            if tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            
            # Verify tesseract is installed
            try:
                pytesseract.get_tesseract_version()
                print("✅ Tesseract OCR available")
            except Exception as e:
                print(f"⚠️ Tesseract OCR not found: {e}")
                self.available = False
        else:
            print("⚠️ pytesseract/PIL not installed")
    
    def preprocess_image(self, image: "Image.Image") -> "Image.Image":
        """Preprocess image for better OCR accuracy."""
        # Convert to grayscale
        if image.mode != "L":
            image = image.convert("L")
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Apply slight blur to reduce noise
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # Binarize (threshold)
        threshold = 150
        image = image.point(lambda x: 255 if x > threshold else 0, mode="1")
        
        return image
    
    async def extract_text(self, image_bytes: bytes) -> str:
        """Extract raw text from image bytes."""
        if not self.available:
            return "OCR not available. Please install Tesseract."
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess
            processed = self.preprocess_image(image)
            
            # Extract text
            text = pytesseract.image_to_string(
                processed,
                lang=self.lang,
                config="--psm 6",  # Assume uniform block of text
            )
            
            return text.strip()
            
        except Exception as e:
            return f"OCR Error: {str(e)}"
    
    def parse_bill_text(self, text: str) -> dict:
        """Parse extracted text to identify bill components."""
        result = {
            "dealer_name": None,
            "date": None,
            "items": [],
            "subtotal": None,
            "tax": None,
            "total": None,
            "raw_text": text,
        }
        
        lines = text.split("\n")
        
        # Extract dealer name (usually in first few lines)
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 3 and not any(char.isdigit() for char in line[:5]):
                result["dealer_name"] = line
                break
        
        # Extract date patterns
        date_patterns = [
            r"\d{2}/\d{2}/\d{4}",           # DD/MM/YYYY
            r"\d{2}-\d{2}-\d{4}",           # DD-MM-YYYY
            r"\d{4}/\d{2}/\d{2}",           # YYYY/MM/DD
            r"\d{4}-\d{2}-\d{2}",           # YYYY-MM-DD
            r"\d{1,2}\s+[A-Za-z]+\s+\d{4}", # 15 January 2024
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                result["date"] = match.group()
                break
        
        # Extract line items (pattern: description qty rate amount)
        item_pattern = r"(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"
        
        for line in lines:
            match = re.match(item_pattern, line.strip())
            if match:
                desc, qty, rate, amount = match.groups()
                # Skip if description looks like a header or total
                if any(word in desc.lower() for word in ["total", "subtotal", "tax", "qty", "rate"]):
                    continue
                
                result["items"].append({
                    "description": desc.strip(),
                    "quantity": float(qty),
                    "rate": float(rate),
                    "amount": float(amount),
                })
        
        # Extract amounts
        amount_patterns = {
            "subtotal": [r"sub\s*total[:\s]*[\₹Rs\.]*\s*([\d,]+(?:\.\d+)?)", r"amount[:\s]*[\₹Rs\.]*\s*([\d,]+(?:\.\d+)?)"],
            "tax": [r"(?:gst|tax|cgst|sgst)[:\s]*[\₹Rs\.]*\s*([\d,]+(?:\.\d+)?)"],
            "total": [r"(?:grand\s*)?total[:\s]*[\₹Rs\.]*\s*([\d,]+(?:\.\d+)?)", r"net\s*amount[:\s]*[\₹Rs\.]*\s*([\d,]+(?:\.\d+)?)"],
        }
        
        for field, patterns in amount_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).replace(",", "")
                    try:
                        result[field] = float(amount_str)
                    except ValueError:
                        pass
                    break
        
        return result
    
    async def scan_and_parse(self, image_bytes: bytes) -> dict:
        """Full pipeline: extract text and parse bill data."""
        raw_text = await self.extract_text(image_bytes)
        parsed = self.parse_bill_text(raw_text)
        return parsed
