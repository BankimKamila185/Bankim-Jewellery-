"""
Reports API Router - Generate business reports.
"""

from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.dependencies import get_sheets_service


router = APIRouter()


class SalesReport(BaseModel):
    """Sales report summary."""
    period_start: str
    period_end: str
    total_sales: float
    total_invoices: int
    total_items_sold: int
    average_invoice_value: float
    top_products: list[dict]
    top_dealers: list[dict]


class PurchaseReport(BaseModel):
    """Purchase report by type."""
    period_start: str
    period_end: str
    material_cost: float
    making_cost: float
    finishing_cost: float
    packing_cost: float
    total_purchases: float
    invoices_by_type: dict


class ProfitReport(BaseModel):
    """Profit analysis report."""
    period_start: str
    period_end: str
    total_revenue: float
    total_cost: float
    gross_profit: float
    profit_margin: float
    products_by_profit: list[dict]


class DealerBalanceReport(BaseModel):
    """Dealer balance report."""
    total_receivable: float
    total_payable: float
    net_position: float
    top_receivables: list[dict]
    top_payables: list[dict]


class LowStockReport(BaseModel):
    """Low stock alert report."""
    total_low_stock_items: int
    products: list[dict]


@router.get("/sales", response_model=SalesReport)
async def sales_report(
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
):
    """Generate sales report for a date range."""
    sheets = get_sheets_service()
    
    # Default to last 30 days
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    invoices = await sheets.get_invoices("Sales")
    
    # Filter by date
    filtered = []
    for inv in invoices:
        inv_date = inv.get("invoice_date", "")
        if inv_date and str(date_from) <= inv_date <= str(date_to):
            filtered.append(inv)
    
    total_sales = sum(float(inv.get("grand_total", 0) or 0) for inv in filtered)
    total_invoices = len(filtered)
    avg_value = total_sales / total_invoices if total_invoices > 0 else 0
    
    # Count items
    total_items = 0
    product_sales = {}
    dealer_sales = {}
    
    for inv in filtered:
        items = inv.get("items", [])
        for item in items:
            total_items += int(item.get("quantity", 0) or 0)
            
            product_id = item.get("product_id", "")
            amount = float(item.get("total_price", 0) or 0)
            product_sales[product_id] = product_sales.get(product_id, 0) + amount
        
        dealer_id = inv.get("dealer_id", "")
        inv_total = float(inv.get("grand_total", 0) or 0)
        dealer_sales[dealer_id] = dealer_sales.get(dealer_id, 0) + inv_total
    
    # Top products and dealers
    top_products = sorted(
        [{"product_id": k, "total_sales": v} for k, v in product_sales.items()],
        key=lambda x: x["total_sales"],
        reverse=True
    )[:10]
    
    top_dealers = sorted(
        [{"dealer_id": k, "total_sales": v} for k, v in dealer_sales.items()],
        key=lambda x: x["total_sales"],
        reverse=True
    )[:10]
    
    return SalesReport(
        period_start=str(date_from),
        period_end=str(date_to),
        total_sales=round(total_sales, 2),
        total_invoices=total_invoices,
        total_items_sold=total_items,
        average_invoice_value=round(avg_value, 2),
        top_products=top_products,
        top_dealers=top_dealers,
    )


@router.get("/purchases", response_model=PurchaseReport)
async def purchase_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
):
    """Generate purchase report by type."""
    sheets = get_sheets_service()
    
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    costs = {"Material": 0, "Making": 0, "Finishing": 0, "Packing": 0}
    counts = {"Material": 0, "Making": 0, "Finishing": 0, "Packing": 0}
    
    for inv_type in costs.keys():
        invoices = await sheets.get_invoices(inv_type)
        
        for inv in invoices:
            inv_date = inv.get("invoice_date", "")
            if inv_date and str(date_from) <= inv_date <= str(date_to):
                costs[inv_type] += float(inv.get("grand_total", 0) or 0)
                counts[inv_type] += 1
    
    total = sum(costs.values())
    
    return PurchaseReport(
        period_start=str(date_from),
        period_end=str(date_to),
        material_cost=round(costs["Material"], 2),
        making_cost=round(costs["Making"], 2),
        finishing_cost=round(costs["Finishing"], 2),
        packing_cost=round(costs["Packing"], 2),
        total_purchases=round(total, 2),
        invoices_by_type=counts,
    )


@router.get("/profit", response_model=ProfitReport)
async def profit_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
):
    """Generate profit analysis report."""
    sheets = get_sheets_service()
    
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Get sales
    sales_invoices = await sheets.get_invoices("Sales")
    total_revenue = 0
    
    for inv in sales_invoices:
        inv_date = inv.get("invoice_date", "")
        if inv_date and str(date_from) <= inv_date <= str(date_to):
            total_revenue += float(inv.get("grand_total", 0) or 0)
    
    # Get costs
    total_cost = 0
    for inv_type in ["Material", "Making", "Finishing", "Packing"]:
        invoices = await sheets.get_invoices(inv_type)
        for inv in invoices:
            inv_date = inv.get("invoice_date", "")
            if inv_date and str(date_from) <= inv_date <= str(date_to):
                total_cost += float(inv.get("grand_total", 0) or 0)
    
    gross_profit = total_revenue - total_cost
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Products by profit
    products = await sheets.get_products()
    products_by_profit = sorted(
        [
            {
                "product_id": p.get("product_id"),
                "name": p.get("name"),
                "profit": float(p.get("profit", 0) or 0),
                "profit_margin": float(p.get("profit_margin", 0) or 0),
            }
            for p in products
        ],
        key=lambda x: x["profit"],
        reverse=True
    )[:10]
    
    return ProfitReport(
        period_start=str(date_from),
        period_end=str(date_to),
        total_revenue=round(total_revenue, 2),
        total_cost=round(total_cost, 2),
        gross_profit=round(gross_profit, 2),
        profit_margin=round(profit_margin, 2),
        products_by_profit=products_by_profit,
    )


@router.get("/dealer-balance", response_model=DealerBalanceReport)
async def dealer_balance_report():
    """Generate dealer balance report."""
    sheets = get_sheets_service()
    dealers = await sheets.get_dealers()
    
    receivables = []  # SELL dealers with balance due to us
    payables = []     # BUY dealers with balance due from us
    
    for dealer in dealers:
        balance = float(dealer.get("current_balance", 0) or 0)
        dealer_type = dealer.get("dealer_type", "")
        
        dealer_info = {
            "dealer_id": dealer.get("dealer_id"),
            "dealer_code": dealer.get("dealer_code"),
            "name": dealer.get("name"),
            "balance": abs(balance),
        }
        
        if dealer_type == "SELL" and balance > 0:
            receivables.append(dealer_info)
        elif dealer_type == "BUY" and balance > 0:
            payables.append(dealer_info)
    
    total_receivable = sum(d["balance"] for d in receivables)
    total_payable = sum(d["balance"] for d in payables)
    
    return DealerBalanceReport(
        total_receivable=round(total_receivable, 2),
        total_payable=round(total_payable, 2),
        net_position=round(total_receivable - total_payable, 2),
        top_receivables=sorted(receivables, key=lambda x: x["balance"], reverse=True)[:10],
        top_payables=sorted(payables, key=lambda x: x["balance"], reverse=True)[:10],
    )


@router.get("/low-stock", response_model=LowStockReport)
async def low_stock_report():
    """Generate low stock alert report."""
    sheets = get_sheets_service()
    products = await sheets.get_products()
    
    low_stock = []
    for product in products:
        stock_qty = int(product.get("stock_qty", 0) or 0)
        min_alert = int(product.get("min_stock_alert", 5) or 5)
        
        if stock_qty <= min_alert:
            low_stock.append({
                "product_id": product.get("product_id"),
                "product_code": product.get("product_code"),
                "name": product.get("name"),
                "stock_qty": stock_qty,
                "min_stock_alert": min_alert,
                "shortage": min_alert - stock_qty,
            })
    
    return LowStockReport(
        total_low_stock_items=len(low_stock),
        products=sorted(low_stock, key=lambda x: x["shortage"], reverse=True),
    )
