"""
Cost Calculator Service - Automatic product cost calculation.
"""

from typing import Optional


class CostCalculator:
    """Service for calculating product costs and profits."""
    
    @staticmethod
    def calculate_final_cost(
        material_cost: float = 0,
        making_cost: float = 0,
        finishing_cost: float = 0,
        packing_cost: float = 0,
        design_cost: float = 0,
    ) -> float:
        """Calculate the final cost of a product."""
        return (
            float(material_cost or 0)
            + float(making_cost or 0)
            + float(finishing_cost or 0)
            + float(packing_cost or 0)
            + float(design_cost or 0)
        )
    
    @staticmethod
    def calculate_profit(selling_price: float, final_cost: float) -> float:
        """Calculate profit (Selling Price - Final Cost)."""
        return float(selling_price or 0) - float(final_cost or 0)
    
    @staticmethod
    def calculate_profit_margin(selling_price: float, profit: float) -> float:
        """Calculate profit margin as percentage."""
        if selling_price and selling_price > 0:
            return round((profit / selling_price) * 100, 2)
        return 0.0
    
    @staticmethod
    def calculate_all(
        material_cost: float = 0,
        making_cost: float = 0,
        finishing_cost: float = 0,
        packing_cost: float = 0,
        design_cost: float = 0,
        selling_price: float = 0,
    ) -> dict:
        """Calculate all cost metrics for a product."""
        final_cost = CostCalculator.calculate_final_cost(
            material_cost, making_cost, finishing_cost, packing_cost, design_cost
        )
        profit = CostCalculator.calculate_profit(selling_price, final_cost)
        profit_margin = CostCalculator.calculate_profit_margin(selling_price, profit)
        
        return {
            "material_cost": float(material_cost or 0),
            "making_cost": float(making_cost or 0),
            "finishing_cost": float(finishing_cost or 0),
            "packing_cost": float(packing_cost or 0),
            "design_cost": float(design_cost or 0),
            "final_cost": final_cost,
            "selling_price": float(selling_price or 0),
            "profit": profit,
            "profit_margin": profit_margin,
        }
    
    @staticmethod
    def calculate_invoice_totals(
        items: list[dict],
        tax_percent: float = 0,
        discount_percent: float = 0,
    ) -> dict:
        """Calculate invoice totals from line items."""
        sub_total = sum(
            float(item.get("quantity", 0)) * float(item.get("unit_price", 0))
            for item in items
        )
        
        tax_amount = sub_total * (float(tax_percent or 0) / 100)
        discount_amount = sub_total * (float(discount_percent or 0) / 100)
        grand_total = sub_total + tax_amount - discount_amount
        
        return {
            "sub_total": round(sub_total, 2),
            "tax_percent": float(tax_percent or 0),
            "tax_amount": round(tax_amount, 2),
            "discount_percent": float(discount_percent or 0),
            "discount_amount": round(discount_amount, 2),
            "grand_total": round(grand_total, 2),
        }
