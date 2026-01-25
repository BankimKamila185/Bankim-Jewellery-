"""
Code Generator Service - Generate unique codes for dealers, products, etc.
"""

from typing import Optional


class CodeGenerator:
    """Service for generating unique codes."""
    
    # Prefix mappings for dealer codes
    DEALER_PREFIXES = {
        ("BUY", "Material"): "MAT",
        ("BUY", "Making"): "MKG",
        ("BUY", "Finishing"): "FIN",
        ("BUY", "Packing"): "PKG",
        ("SELL", "Customer"): "CUS",
    }
    
    # Category prefixes for products
    PRODUCT_CATEGORY_PREFIXES = {
        "Necklace": "NKL",
        "Ring": "RNG",
        "Earring": "EAR",
        "Bracelet": "BRC",
        "Bangle": "BNG",
        "Pendant": "PND",
        "Chain": "CHN",
        "Anklet": "ANK",
        "Nose Ring": "NOS",
        "Mangalsutra": "MNG",
        "Set": "SET",
    }
    
    @staticmethod
    def generate_dealer_code(
        dealer_type: str,
        dealer_category: str,
        existing_codes: list[str],
    ) -> str:
        """Generate a unique dealer code based on type and category."""
        prefix = CodeGenerator.DEALER_PREFIXES.get(
            (dealer_type, dealer_category),
            "DLR"
        )
        
        # Find max existing number for this prefix
        max_num = 0
        for code in existing_codes:
            if code.startswith(prefix):
                try:
                    num = int(code.split("-")[1])
                    max_num = max(max_num, num)
                except (IndexError, ValueError):
                    continue
        
        return f"{prefix}-{max_num + 1:04d}"
    
    @staticmethod
    def generate_product_code(
        category: str,
        product_number: int,
    ) -> str:
        """Generate a unique product code based on category."""
        # Get category prefix or use first 3 chars
        prefix = CodeGenerator.PRODUCT_CATEGORY_PREFIXES.get(
            category,
            category[:3].upper() if category else "GEN"
        )
        
        return f"JWL-{prefix}-{product_number:05d}"
    
    @staticmethod
    def generate_invoice_number(
        invoice_type: str,
        year: int,
        sequence: int,
    ) -> str:
        """Generate a display invoice number."""
        type_prefixes = {
            "Material": "MAT",
            "Making": "MKG",
            "Finishing": "FIN",
            "Packing": "PKG",
            "Sales": "SAL",
        }
        
        prefix = type_prefixes.get(invoice_type, "INV")
        return f"{prefix}-{year}-{sequence:05d}"
    
    @staticmethod
    def extract_sequence_number(id_string: str) -> int:
        """Extract the sequence number from an ID string."""
        try:
            parts = id_string.split("-")
            return int(parts[-1])
        except (IndexError, ValueError):
            return 0
