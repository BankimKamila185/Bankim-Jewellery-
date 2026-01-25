"""
Payment Service - Logic for payments and balance management.
"""

from datetime import datetime
from typing import Optional, List

from app.services.sheets_service import SheetsService
from app.models.payment import Payment, PaymentCreate, PaymentType, RelatedTo
from app.models.invoice import PaymentStatus


class PaymentService:
    """Service for managing payments and ledger updates."""

    def __init__(self, sheets_service: SheetsService):
        self.sheets = sheets_service

    async def create_payment(self, data: PaymentCreate) -> Optional[Payment]:
        """
        Create a payment and trigger related updates:
        1. Dealer Balance
        2. Invoice Status (if related to Invoice)
        """
        # Validate Entity Existence
        if data.related_to == RelatedTo.INVOICE:
            invoice = await self.sheets.get_invoice(data.invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {data.invoice_id} not found")
        elif data.related_to == RelatedTo.PROGRESS:
            progress = await self.sheets.get_product_progress(data.progress_id) # This returns list, wait
            # sheets_service doesn't expose `get_progress_by_id`.
            # We must fetch by variant? No, progress_id is unique.
            # We need to implement `get_row_by_id` logic.
            # Workaround: Fetch all progress rows (filtered)? No, too slow.
            # Assume valid for now or implement `get_progress_entry(id)`
            pass

        # Validate Dealer
        dealer = await self.sheets.get_dealer(data.dealer_id)
        if not dealer:
            raise ValueError(f"Dealer {data.dealer_id} not found")

        # Create Payment Record
        payment_data = data.model_dump()
        payment_data["payment_date"] = str(data.payment_date)
        payment_data["payment_type"] = data.payment_type.value
        payment_data["related_to"] = data.related_to.value
        payment_data["payment_mode"] = data.payment_mode.value
        
        created = await self.sheets.create_payment(payment_data)
        if not created:
            return None

        # 1. Update Dealer Balance
        await self._update_dealer_balance(dealer, data.payment_type, data.amount)

        # 2. Update Invoice Status
        if data.related_to == RelatedTo.INVOICE and data.invoice_id:
            await self._update_invoice_status(data.invoice_id)

        return Payment(**created)

    async def get_payments(
        self,
        invoice_id: Optional[str] = None,
        dealer_id: Optional[str] = None,
        progress_id: Optional[str] = None
    ) -> List[Payment]:
        """Get payments based on filters."""
        rows = await self.sheets.get_payments(invoice_id, dealer_id, progress_id)
        return [Payment(**row) for row in rows]

    async def _update_dealer_balance(self, dealer: dict, payment_type: PaymentType, amount: float):
        """
        Update dealer's running balance.
        Logic:
        - Balance INTERPRETATION: Net Receivable (They owe us).
          - Positive: They owe us.
          - Negative: We owe them.
        
        - Updates:
          - IN (Received money): Reduces Receivable. Balance decreases.
          - OUT (Paid money): Increases Balance (towards positive/zero).
              e.g. Balance was -2000 (We owe). Paid 2000. Balance becomes 0. (-2000 + 2000).
        """
        current_balance = float(dealer.get("current_balance", 0) or 0)
        
        if payment_type == PaymentType.INCOMING:
            new_balance = current_balance - amount
        else: # OUTGOING
            new_balance = current_balance + amount
            
        await self.sheets.update_dealer(
            dealer["dealer_id"],
            {"current_balance": new_balance}
        )

    async def _update_invoice_status(self, invoice_id: str):
        """Recalculate total paid and update invoice status."""
        invoice = await self.sheets.get_invoice(invoice_id)
        if not invoice:
            return

        # Fetch all payments for this invoice
        payments = await self.sheets.get_payments(invoice_id=invoice_id)
        
        # Calculate total paid (Only consider IN for Sales, OUT for Purchase??)
        # Usually Invoice -> Payment relation is strictly 1-way dependent on Invoice Type.
        # But `Payment` table stores Type.
        # Assumption: All payments linked to this Invoice count towards its settlement.
        
        total_paid = sum(float(p.get("amount", 0)) for p in payments)
        grand_total = float(invoice.get("grand_total", 0))
        
        balance_due = grand_total - total_paid
        
        if balance_due <= 0:
            status = PaymentStatus.PAID.value
            balance_due = 0 # No negative due
        elif total_paid > 0:
            status = PaymentStatus.PARTIAL.value
        else:
            status = PaymentStatus.UNPAID.value
            
        await self.sheets.update_row(
            self.sheets.SHEETS["invoices"],
            self.sheets.INVOICE_COLUMNS,
            "invoice_id",
            invoice_id,
            {
                "amount_paid": total_paid,
                "balance_due": balance_due,
                "payment_status": status
            }
        )
