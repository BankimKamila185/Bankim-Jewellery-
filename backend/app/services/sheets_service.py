"""
Google Sheets Service - CRUD operations for all data storage.
Uses Service Account authentication for server-to-server access.
"""

import os
from datetime import datetime
from typing import Any, Optional
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


class SheetsService:
    """Service for Google Sheets operations."""
    
    # Sheet names matching our schema
    SHEETS = {
        "designs": "Designs",
        "variants": "ProductVariants",
        "dealers": "Dealers",
        "designers": "Designers",
        "materials": "Materials",
        "invoices": "Invoices",
        "invoice_items": "InvoiceItems",
        "cost_breakdown": "CostBreakdown",
        "settings": "Settings",
        "workflow_stages": "WorkflowStages",
        "product_progress": "ProductProgress",
        "payments": "Payments",
        "plating_rates": "PlatingRates",
        "plating_jobs": "PlatingJobs",
    }
    
    # Column mappings for each sheet (0-indexed)
    DESIGN_COLUMNS = [
        "design_id", "name", "category", "designer_id",
        "base_design_cost", "image_drive_link", "spec_doc_link",
        "notes", "status", "created_at", "updated_at"
    ]

    VARIANT_COLUMNS = [
        "variant_id", "design_id", "variant_code", "size", "finish",
        "material_cost", "making_cost", "finishing_cost", "packing_cost", "design_cost",
        "final_cost", "selling_price", "profit", "profit_margin",
        "stock_qty", "image_drive_link",
        "notes", "status", "created_at", "updated_at"
    ]
    DEALER_COLUMNS = [
        "dealer_id", "dealer_code", "dealer_type", "dealer_category", "name",
        "contact_person", "phone", "email", "address", "gstin",
        "bank_name", "account_no", "ifsc", "opening_balance", "current_balance",
        "notes", "status", "created_at", "updated_at"
    ]
    
    DESIGNER_COLUMNS = [
        "designer_id", "name", "company", "phone", "email",
        "charge_type", "default_rate", "specialization", "portfolio",
        "notes", "status", "created_at", "updated_at"
    ]
    
    MATERIAL_COLUMNS = [
        "material_id", "name", "category", "unit",
        "current_stock", "min_stock_alert",
        "last_purchase_price", "last_purchase_date",
        "notes", "status", "created_at", "updated_at"
    ]
    
    INVOICE_COLUMNS = [
        "invoice_id", "invoice_number", "invoice_type", "dealer_id",
        "invoice_date", "due_date", "sub_total", "tax_percent", "tax_amount",
        "discount_percent", "discount_amount", "grand_total", "amount_paid",
        "balance_due", "payment_status", "bill_image_link", "notes",
        "created_at", "updated_at"
    ]
    
    INVOICE_ITEM_COLUMNS = [
        "item_id", "invoice_id", "product_id", "description", "quantity",
        "unit_price", "total_price", "cost_type", "notes"
    ]
    
    COST_BREAKDOWN_COLUMNS = [
        "breakdown_id", "product_id", "cost_type", "invoice_id", "dealer_id",
        "amount", "date", "notes", "created_at"
    ]
    
    SETTINGS_COLUMNS = [
        "setting_key", "setting_value", "category", "updated_at"
    ]
    
    WORKFLOW_STAGE_COLUMNS = [
        "stage_order", "stage_code", "display_name", "is_final_stage"
    ]
    
    PRODUCT_PROGRESS_COLUMNS = [
        "progress_id", "variant_id", "design_id", "stage_code",
        "assigned_dealer_id", "quantity", "status", "cost",
        "start_date", "end_date", "remarks",
        "created_at", "updated_at"
    ]
    
    PAYMENT_COLUMNS = [
        "payment_id", "payment_type", "related_to", "invoice_id",
        "progress_id", "dealer_id", "amount", "payment_mode",
        "reference_no", "payment_date", "notes",
        "created_at", "updated_at"
    ]
    
    PLATING_RATE_COLUMNS = [
        "rate_id", "plating_type", "rate_per_kg", "unit", 
        "effective_from", "vendor_dealer_id", "status",
        "created_at", "updated_at"
    ]
    
    PLATING_JOB_COLUMNS = [
        "job_id", "progress_id", "variant_id", "design_id", 
        "dealer_id", "quantity", "plating_type", "weight_in_kg", "rate_per_kg", 
        "calculated_cost", "status", "start_date", "end_date", "notes",
        "created_at", "updated_at"
    ]
    
    def __init__(self, credentials_path: str, spreadsheet_id: str, credentials_json: Optional[str] = None):
        """Initialize the Sheets service with credentials."""
        self.spreadsheet_id = spreadsheet_id
        self.service = None
        
        if credentials_json:
            self._authenticate_from_json(credentials_json)
        elif credentials_path and spreadsheet_id:
            self._authenticate(credentials_path)
    
    def _authenticate(self, credentials_path: str):
        """Authenticate with Google Sheets API using service account file."""
        try:
            creds_path = Path(credentials_path)
            if not creds_path.is_absolute():
                # Resolve relative to backend directory
                creds_path = Path(__file__).resolve().parent.parent.parent / credentials_path
            
            if not creds_path.exists():
                print(f"⚠️ Credentials file not found: {creds_path}")
                print("   Please add your service_account.json to the credentials folder")
                return
            
            credentials = service_account.Credentials.from_service_account_file(
                str(creds_path),
                scopes=[
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive",
                ]
            )
            
            self.service = build("sheets", "v4", credentials=credentials)
            print("✅ Google Sheets service authenticated (File)")
            
        except Exception as e:
            print(f"❌ Failed to authenticate with Google Sheets: {e}")
            self.service = None

    def _authenticate_from_json(self, json_content: str):
        """Authenticate using JSON string content."""
        try:
            import json
            info = json.loads(json_content)
            credentials = service_account.Credentials.from_service_account_info(
                info,
                scopes=[
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive",
                ]
            )
            self.service = build("sheets", "v4", credentials=credentials)
            print("✅ Google Sheets service authenticated (Env Var)")
        except Exception as e:
            print(f"❌ Failed to authenticate with Google Sheets JSON: {e}")
            self.service = None
    
    def _get_column_index(self, columns: list, field: str) -> int:
        """Get the column index for a field name."""
        try:
            return columns.index(field)
        except ValueError:
            return -1
    
    def _row_to_dict(self, row: list, columns: list) -> dict:
        """Convert a row to a dictionary using column mapping."""
        result = {}
        for i, col in enumerate(columns):
            if i < len(row):
                result[col] = row[i]
            else:
                result[col] = None
        return result
    
    def _dict_to_row(self, data: dict, columns: list) -> list:
        """Convert a dictionary to a row using column mapping."""
        return [data.get(col, "") for col in columns]
    
    async def get_all_rows(self, sheet_name: str, columns: list) -> list[dict]:
        """Get all rows from a sheet as dictionaries."""
        if not self.service:
            return []
        
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A2:Z",  # Skip header row
            ).execute()
            
            rows = result.get("values", [])
            return [self._row_to_dict(row, columns) for row in rows]
            
        except HttpError as e:
            print(f"Error reading from {sheet_name}: {e}")
            return []
    
    async def get_row_by_id(
        self, sheet_name: str, columns: list, id_field: str, id_value: str
    ) -> Optional[dict]:
        """Get a single row by its ID field."""
        rows = await self.get_all_rows(sheet_name, columns)
        for row in rows:
            if row.get(id_field) == id_value:
                return row
        return None
    
    async def append_row(self, sheet_name: str, columns: list, data: dict) -> bool:
        """Append a new row to a sheet."""
        if not self.service:
            return False
        
        try:
            row = self._dict_to_row(data, columns)
            
            self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A:Z",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": [row]},
            ).execute()
            
            return True
            
        except HttpError as e:
            print(f"Error appending to {sheet_name}: {e}")
            return False
    
    async def update_row(
        self, sheet_name: str, columns: list, id_field: str, id_value: str, data: dict
    ) -> bool:
        """Update a row by its ID field."""
        if not self.service:
            return False
        
        try:
            # First, find the row number
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A:A",
            ).execute()
            
            rows = result.get("values", [])
            id_col_idx = self._get_column_index(columns, id_field)
            
            # Find the row with matching ID
            row_num = None
            for i, row in enumerate(rows):
                if i == 0:  # Skip header
                    continue
                if row and row[0] == id_value:
                    row_num = i + 1  # 1-indexed
                    break
            
            if row_num is None:
                return False
            
            # Get current row data
            current = await self.get_row_by_id(sheet_name, columns, id_field, id_value)
            if not current:
                return False
            
            # Merge with updates
            updated = {**current, **data, "updated_at": datetime.now().isoformat()}
            row = self._dict_to_row(updated, columns)
            
            # Update the row
            self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A{row_num}:Z{row_num}",
                valueInputOption="USER_ENTERED",
                body={"values": [row]},
            ).execute()
            
            return True
            
        except HttpError as e:
            print(f"Error updating {sheet_name}: {e}")
            return False
    
    async def delete_row(
        self, sheet_name: str, columns: list, id_field: str, id_value: str
    ) -> bool:
        """Delete a row by its ID field (sets status to Deleted)."""
        # Soft delete by updating status
        return await self.update_row(
            sheet_name, columns, id_field, id_value, {"status": "Deleted"}
        )
    
    async def get_next_id(self, sheet_name: str, prefix: str) -> str:
        """Generate the next ID for a sheet (e.g., DLR-00001)."""
        if not self.service:
            return f"{prefix}-00001"
        
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A:A",
            ).execute()
            
            rows = result.get("values", [])
            if len(rows) <= 1:  # Only header or empty
                return f"{prefix}-00001"
            
            # Extract numbers from existing IDs
            max_num = 0
            for row in rows[1:]:  # Skip header
                if row and row[0].startswith(prefix):
                    try:
                        num = int(row[0].split("-")[1])
                        max_num = max(max_num, num)
                    except (IndexError, ValueError):
                        continue
            
            return f"{prefix}-{max_num + 1:05d}"
            
        except HttpError as e:
            print(f"Error getting next ID for {sheet_name}: {e}")
            return f"{prefix}-00001"
    
    async def filter_rows(
        self, sheet_name: str, columns: list, filters: dict
    ) -> list[dict]:
        """Get rows matching filter criteria."""
        rows = await self.get_all_rows(sheet_name, columns)
        
        filtered = []
        for row in rows:
            match = True
            for key, value in filters.items():
                if row.get(key) != value:
                    match = False
                    break
            if match:
                filtered.append(row)
        
        return filtered
    
    # ============ Dealer Operations ============
    
    async def get_dealers(self, dealer_type: Optional[str] = None) -> list[dict]:
        """Get all dealers, optionally filtered by type."""
        if dealer_type:
            return await self.filter_rows(
                self.SHEETS["dealers"],
                self.DEALER_COLUMNS,
                {"dealer_type": dealer_type, "status": "Active"}
            )
        return await self.filter_rows(
            self.SHEETS["dealers"],
            self.DEALER_COLUMNS,
            {"status": "Active"}
        )
    
    async def get_dealer(self, dealer_id: str) -> Optional[dict]:
        """Get a dealer by ID."""
        return await self.get_row_by_id(
            self.SHEETS["dealers"],
            self.DEALER_COLUMNS,
            "dealer_id",
            dealer_id
        )
    
    async def create_dealer(self, data: dict) -> Optional[dict]:
        """Create a new dealer."""
        dealer_id = await self.get_next_id(self.SHEETS["dealers"], "DLR")
        now = datetime.now().isoformat()
        
        dealer = {
            **data,
            "dealer_id": dealer_id,
            "current_balance": data.get("opening_balance", 0),
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["dealers"],
            self.DEALER_COLUMNS,
            dealer
        )
        
        return dealer if success else None
    
    async def update_dealer(self, dealer_id: str, data: dict) -> bool:
        """Update an existing dealer."""
        return await self.update_row(
            self.SHEETS["dealers"],
            self.DEALER_COLUMNS,
            "dealer_id",
            dealer_id,
            data
        )
    
    async def delete_dealer(self, dealer_id: str) -> bool:
        """Soft delete a dealer."""
        return await self.delete_row(
            self.SHEETS["dealers"],
            self.DEALER_COLUMNS,
            "dealer_id",
            dealer_id
        )
    
    # ============ Designer Operations ============
    
    async def get_designers(self) -> list[dict]:
        """Get all active designers."""
        return await self.filter_rows(
            self.SHEETS["designers"],
            self.DESIGNER_COLUMNS,
            {"status": "Active"}
        )
    
    async def get_designer(self, designer_id: str) -> Optional[dict]:
        """Get a designer by ID."""
        return await self.get_row_by_id(
            self.SHEETS["designers"],
            self.DESIGNER_COLUMNS,
            "designer_id",
            designer_id
        )
    
    async def create_designer(self, data: dict) -> Optional[dict]:
        """Create a new designer."""
        designer_id = await self.get_next_id(self.SHEETS["designers"], "DES")
        now = datetime.now().isoformat()
        
        designer = {
            **data,
            "designer_id": designer_id,
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["designers"],
            self.DESIGNER_COLUMNS,
            designer
        )
        
        return designer if success else None
    
    async def update_designer(self, designer_id: str, data: dict) -> bool:
        """Update an existing designer."""
        return await self.update_row(
            self.SHEETS["designers"],
            self.DESIGNER_COLUMNS,
            "designer_id",
            designer_id,
            data
        )
    
    async def delete_designer(self, designer_id: str) -> bool:
        """Soft delete a designer."""
        return await self.delete_row(
            self.SHEETS["designers"],
            self.DESIGNER_COLUMNS,
            "designer_id",
            designer_id
        )
    
    # ============ Material Operations ============
    
    async def get_materials(self, category: Optional[str] = None) -> list[dict]:
        """Get all active materials."""
        materials = await self.filter_rows(
            self.SHEETS["materials"],
            self.MATERIAL_COLUMNS,
            {"status": "Active"}
        )
        
        if category:
            materials = [m for m in materials if m.get("category") == category]
            
        return materials
    
    async def get_material(self, material_id: str) -> Optional[dict]:
        """Get a material by ID."""
        return await self.get_row_by_id(
            self.SHEETS["materials"],
            self.MATERIAL_COLUMNS,
            "material_id",
            material_id
        )
    
    async def create_material(self, data: dict) -> Optional[dict]:
        """Create a new material."""
        material_id = await self.get_next_id(self.SHEETS["materials"], "MAT")
        now = datetime.now().isoformat()
        
        material = {
            **data,
            "material_id": material_id,
            "current_stock": 0,
            "last_purchase_price": 0,
            "status": "Active",
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["materials"],
            self.MATERIAL_COLUMNS,
            material
        )
        
        return material if success else None
    
    async def update_material(self, material_id: str, data: dict) -> bool:
        """Update an existing material."""
        return await self.update_row(
            self.SHEETS["materials"],
            self.MATERIAL_COLUMNS,
            "material_id",
            material_id,
            data
        )
    
    async def delete_material(self, material_id: str) -> bool:
        """Soft delete a material."""
        return await self.delete_row(
            self.SHEETS["materials"],
            self.MATERIAL_COLUMNS,
            "material_id",
            material_id
        )
    
    # ============ Design Operations ============

    async def get_designs(self) -> list[dict]:
        """Get all active designs."""
        return await self.filter_rows(
            self.SHEETS["designs"],
            self.DESIGN_COLUMNS,
            {"status": "Active"}
        )

    async def get_design(self, design_id: str) -> Optional[dict]:
        """Get a design by ID."""
        return await self.get_row_by_id(
            self.SHEETS["designs"],
            self.DESIGN_COLUMNS,
            "design_id",
            design_id
        )

    async def create_design(self, data: dict) -> Optional[dict]:
        """Create a new design."""
        design_id = await self.get_next_id(self.SHEETS["designs"], "DES")
        now = datetime.now().isoformat()
        
        design = {
            **data,
            "design_id": design_id,
            "status": "Active",
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["designs"],
            self.DESIGN_COLUMNS,
            design
        )
        
        return design if success else None

    async def update_design(self, design_id: str, data: dict) -> bool:
        """Update an existing design."""
        return await self.update_row(
            self.SHEETS["designs"],
            self.DESIGN_COLUMNS,
            "design_id",
            design_id,
            data
        )

    async def delete_design(self, design_id: str) -> bool:
        """Soft delete a design."""
        return await self.delete_row(
            self.SHEETS["designs"],
            self.DESIGN_COLUMNS,
            "design_id",
            design_id
        )

    # ============ Variant Operations ============

    async def get_variants(self, design_id: Optional[str] = None) -> list[dict]:
        """Get all active variants, optionally filtered by design."""
        if design_id:
            return await self.filter_rows(
                self.SHEETS["variants"],
                self.VARIANT_COLUMNS,
                {"design_id": design_id, "status": "Active"}
            )
        return await self.filter_rows(
            self.SHEETS["variants"],
            self.VARIANT_COLUMNS,
            {"status": "Active"}
        )

    async def get_variant(self, variant_id: str) -> Optional[dict]:
        """Get a variant by ID."""
        return await self.get_row_by_id(
            self.SHEETS["variants"],
            self.VARIANT_COLUMNS,
            "variant_id",
            variant_id
        )

    async def create_variant(self, data: dict) -> Optional[dict]:
        """Create a new variant with cost calculations."""
        variant_id = await self.get_next_id(self.SHEETS["variants"], "VAR")
        now = datetime.now().isoformat()
        
        # Calculate costs
        material = float(data.get("material_cost", 0) or 0)
        making = float(data.get("making_cost", 0) or 0)
        finishing = float(data.get("finishing_cost", 0) or 0)
        packing = float(data.get("packing_cost", 0) or 0)
        design = float(data.get("design_cost", 0) or 0)
        
        final_cost = material + making + finishing + packing + design
        selling_price = float(data.get("selling_price", 0) or 0)
        profit = selling_price - final_cost
        profit_margin = (profit / selling_price * 100) if selling_price > 0 else 0
        
        variant = {
            **data,
            "variant_id": variant_id,
            "material_cost": material,
            "making_cost": making,
            "finishing_cost": finishing,
            "packing_cost": packing,
            "design_cost": design,
            "final_cost": final_cost,
            "profit": profit,
            "profit_margin": round(profit_margin, 2),
            "status": "Active",
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["variants"],
            self.VARIANT_COLUMNS,
            variant
        )
        
        return variant if success else None

    async def update_variant(self, variant_id: str, data: dict) -> bool:
        """Update an existing variant."""
        # Recalculate if cost/price fields are present
        current = await self.get_variant(variant_id)
        if not current:
            return False
            
        merged = {**current, **data}
        
        material = float(merged.get("material_cost", 0) or 0)
        making = float(merged.get("making_cost", 0) or 0)
        finishing = float(merged.get("finishing_cost", 0) or 0)
        packing = float(merged.get("packing_cost", 0) or 0)
        design = float(merged.get("design_cost", 0) or 0)
        
        final_cost = material + making + finishing + packing + design
        selling_price = float(merged.get("selling_price", 0) or 0)
        profit = selling_price - final_cost
        profit_margin = (profit / selling_price * 100) if selling_price > 0 else 0
        
        data["final_cost"] = final_cost
        data["profit"] = profit
        data["profit_margin"] = round(profit_margin, 2)
        
        return await self.update_row(
            self.SHEETS["variants"],
            self.VARIANT_COLUMNS,
            "variant_id",
            variant_id,
            data
        )

    async def delete_variant(self, variant_id: str) -> bool:
        """Soft delete a variant."""
        return await self.delete_row(
            self.SHEETS["variants"],
            self.VARIANT_COLUMNS,
            "variant_id",
            variant_id
        )

    # ============ Invoice Operations ============
    
    async def get_invoices(
        self, invoice_type: Optional[str] = None, dealer_id: Optional[str] = None
    ) -> list[dict]:
        """Get all invoices with optional filtering."""
        invoices = await self.get_all_rows(
            self.SHEETS["invoices"],
            self.INVOICE_COLUMNS
        )
        
        if invoice_type:
            invoices = [i for i in invoices if i.get("invoice_type") == invoice_type]
        if dealer_id:
            invoices = [i for i in invoices if i.get("dealer_id") == dealer_id]
        
        return invoices
    
    async def get_invoice(self, invoice_id: str) -> Optional[dict]:
        """Get an invoice by ID with its items."""
        invoice = await self.get_row_by_id(
            self.SHEETS["invoices"],
            self.INVOICE_COLUMNS,
            "invoice_id",
            invoice_id
        )
        
        if invoice:
            # Get invoice items
            items = await self.filter_rows(
                self.SHEETS["invoice_items"],
                self.INVOICE_ITEM_COLUMNS,
                {"invoice_id": invoice_id}
            )
            invoice["items"] = items
        
        return invoice
    
    async def create_invoice(self, data: dict, items: list[dict]) -> Optional[dict]:
        """Create a new invoice with items."""
        invoice_id = await self.get_next_id(self.SHEETS["invoices"], "INV")
        now = datetime.now().isoformat()
        
        # Generate invoice number
        invoice_type = data.get("invoice_type", "GEN")
        type_prefix = {
            "Material": "MAT",
            "Making": "MKG",
            "Finishing": "FIN",
            "Packing": "PKG",
            "Sales": "SAL",
        }.get(invoice_type, "INV")
        
        year = datetime.now().year
        invoice_number = f"{type_prefix}-{year}-{invoice_id.split('-')[1]}"
        
        # Calculate totals
        sub_total = sum(item["quantity"] * item["unit_price"] for item in items)
        tax_percent = float(data.get("tax_percent", 0) or 0)
        discount_percent = float(data.get("discount_percent", 0) or 0)
        
        tax_amount = sub_total * (tax_percent / 100)
        discount_amount = sub_total * (discount_percent / 100)
        grand_total = sub_total + tax_amount - discount_amount
        
        invoice = {
            **data,
            "invoice_id": invoice_id,
            "invoice_number": invoice_number,
            "sub_total": sub_total,
            "tax_amount": round(tax_amount, 2),
            "discount_amount": round(discount_amount, 2),
            "grand_total": round(grand_total, 2),
            "amount_paid": 0,
            "balance_due": round(grand_total, 2),
            "payment_status": "Unpaid",
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["invoices"],
            self.INVOICE_COLUMNS,
            invoice
        )
        
        if not success:
            return None
        
        # Create invoice items
        for i, item in enumerate(items):
            item_id = f"ITM-{invoice_id.split('-')[1]}-{i+1:03d}"
            
            # Map item fields
            item_data = {
                "item_id": item_id,
                "invoice_id": invoice_id,
                "product_id": item.get("product_id"),
                "description": item.get("description"),
                "quantity": item.get("quantity"),
                "unit_price": item.get("unit_price"),
                "total_price": item.get("total_price"),
                "cost_type": item.get("cost_type"),
                "notes": item.get("notes"),
            }
            
            await self.append_row(
                self.SHEETS["invoice_items"],
                self.INVOICE_ITEM_COLUMNS,
                item_data
            )
            
        return invoice
    
    # ============ Workflow & Progress Operations ============
    
    async def get_workflow_stages(self) -> list[dict]:
        """Get all workflow stages ordered by sequence."""
        stages = await self.get_all_rows(
            self.SHEETS["workflow_stages"],
            self.WORKFLOW_STAGE_COLUMNS
        )
        # Sort by stage_order (convert to int)
        try:
            stages.sort(key=lambda x: int(x.get("stage_order", 0)))
        except ValueError:
            pass
        return stages
        
    async def get_product_progress(self, variant_id: str) -> list[dict]:
        """Get progress history for a variant."""
        return await self.filter_rows(
            self.SHEETS["product_progress"],
            self.PRODUCT_PROGRESS_COLUMNS,
            {"variant_id": variant_id}
        )
    
    async def get_current_stage(self, variant_id: str) -> Optional[dict]:
        """Get the current active stage for a variant."""
        history = await self.get_product_progress(variant_id)
        # Find entry with status != Completed (Pending or InProgress)
        for entry in history:
            if entry.get("status") in ["Pending", "InProgress"]:
                return entry
        
        # If all completed, return the last one (Delivered)
        if history:
            # Sort by date descending
            history.sort(
                key=lambda x: x.get("created_at", ""), 
                reverse=True
            )
            return history[0]
            
        return None
        
    async def create_progress_entry(self, data: dict) -> Optional[dict]:
        """Create a new progress entry."""
        progress_id = await self.get_next_id(self.SHEETS["product_progress"], "PRG")
        now = datetime.now().isoformat()
        
        entry = {
            **data,
            "progress_id": progress_id,
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["product_progress"],
            self.PRODUCT_PROGRESS_COLUMNS,
            entry
        )
        
        return entry if success else None
        
    async def update_progress_entry(self, progress_id: str, data: dict) -> bool:
        """Update a progress entry."""
        return await self.update_row(
            self.SHEETS["product_progress"],
            self.PRODUCT_PROGRESS_COLUMNS,
            "progress_id",
            progress_id,
            data
        )
        
    # ============ Payment Operations ============
    
    async def get_payments(
        self,
        invoice_id: Optional[str] = None,
        dealer_id: Optional[str] = None,
        progress_id: Optional[str] = None
    ) -> list[dict]:
        """Get payments with optional filtering."""
        payments = await self.get_all_rows(
            self.SHEETS["payments"],
            self.PAYMENT_COLUMNS
        )
        
        if invoice_id:
            payments = [p for p in payments if p.get("invoice_id") == invoice_id]
        if dealer_id:
            payments = [p for p in payments if p.get("dealer_id") == dealer_id]
        if progress_id:
            payments = [p for p in payments if p.get("progress_id") == progress_id]
            
        return payments
        
    async def create_payment(self, data: dict) -> Optional[dict]:
        """Create a new payment."""
        payment_id = await self.get_next_id(self.SHEETS["payments"], "PAY")
        now = datetime.now().isoformat()
        
        entry = {
            **data,
            "payment_id": payment_id,
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["payments"],
            self.PAYMENT_COLUMNS,
            entry
        )
        
        return entry if success else None
        
    async def record_payment(self, invoice_id: str, amount: float) -> bool:
        """Deprecated: Use create_payment instead. This was for direct invoice updates."""
        # Kept for backward compatibility if used elsewhere, but ideally logic moves to PaymentService
        pass
            

    
    async def _update_product_cost(
        self,
        product_id: str,
        cost_type: str,
        amount: float,
        invoice_id: str,
        dealer_id: str
    ):
        """Update a product's cost based on an invoice."""
        product = await self.get_product(product_id)
        if not product:
            return
        
        # Map invoice type to cost field
        cost_field_map = {
            "Material": "material_cost",
            "Making": "making_cost",
            "Finishing": "finishing_cost",
            "Packing": "packing_cost",
        }
        
        cost_field = cost_field_map.get(cost_type)
        if cost_field:
            # Add to existing cost
            current_cost = float(product.get(cost_field, 0) or 0)
            new_cost = current_cost + amount
            
            await self.update_product(product_id, {cost_field: new_cost})
        
        # Also add to cost breakdown
        breakdown_id = await self.get_next_id(self.SHEETS["cost_breakdown"], "CST")
        now = datetime.now()
        
        breakdown = {
            "breakdown_id": breakdown_id,
            "product_id": product_id,
            "cost_type": cost_type,
            "invoice_id": invoice_id,
            "dealer_id": dealer_id,
            "amount": amount,
            "date": now.strftime("%Y-%m-%d"),
            "notes": "",
            "created_at": now.isoformat(),
        }
        
        await self.append_row(
            self.SHEETS["cost_breakdown"],
            self.COST_BREAKDOWN_COLUMNS,
            breakdown
        )
    
    async def record_payment(self, invoice_id: str, amount: float) -> bool:
        """Record a payment against an invoice."""
        invoice = await self.get_invoice(invoice_id)
        if not invoice:
            return False
        
        current_paid = float(invoice.get("amount_paid", 0) or 0)
        grand_total = float(invoice.get("grand_total", 0) or 0)
        
        new_paid = current_paid + amount
        balance_due = grand_total - new_paid
        
        if balance_due <= 0:
            status = "Paid"
            balance_due = 0
        elif new_paid > 0:
            status = "Partial"
        else:
            status = "Unpaid"
        
        return await self.update_row(
            self.SHEETS["invoices"],
            self.INVOICE_COLUMNS,
            "invoice_id",
            invoice_id,
            {
                "amount_paid": new_paid,
                "balance_due": balance_due,
                "payment_status": status,
            }
        )
    
    # ============ Cost Breakdown Operations ============
    
    async def get_cost_breakdown(self, product_id: str) -> list[dict]:
        """Get all cost entries for a product."""
        return await self.filter_rows(
            self.SHEETS["cost_breakdown"],
            self.COST_BREAKDOWN_COLUMNS,
            {"product_id": product_id}
        )
    
    # ============ Settings Operations ============
    
    async def get_settings(self) -> dict:
        """Get all settings as a dictionary."""
        rows = await self.get_all_rows(
            self.SHEETS["settings"],
            self.SETTINGS_COLUMNS
        )
        
        return {row["setting_key"]: row["setting_value"] for row in rows if row.get("setting_key")}
    
    async def update_setting(self, key: str, value: str, category: str = "General") -> bool:
        """Update or create a setting."""
        settings = await self.get_all_rows(
            self.SHEETS["settings"],
            self.SETTINGS_COLUMNS
        )
        
        # Check if setting exists
        for setting in settings:
            if setting.get("setting_key") == key:
                return await self.update_row(
                    self.SHEETS["settings"],
                    self.SETTINGS_COLUMNS,
                    "setting_key",
                    key,
                    {"setting_value": value, "category": category}
                )
        
        # Create new setting
        return await self.append_row(
            self.SHEETS["settings"],
            self.SETTINGS_COLUMNS,
            {
                "setting_key": key,
                "setting_value": value,
                "category": category,
                "updated_at": datetime.now().isoformat(),
            }
        )
    # ============ Plating Operations ============
    
    async def get_plating_rates(self) -> list[dict]:
        """Get all plating rates."""
        return await self.filter_rows(
            self.SHEETS["plating_rates"],
            self.PLATING_RATE_COLUMNS,
            {"status": "Active"}
        )
    
    async def create_plating_rate(self, data: dict) -> Optional[dict]:
        """Create a new plating rate."""
        rate_id = await self.get_next_id(self.SHEETS["plating_rates"], "RATE")
        now = datetime.now().isoformat()
        
        rate = {
            **data,
            "rate_id": rate_id,
            "status": "Active",
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["plating_rates"],
            self.PLATING_RATE_COLUMNS,
            rate
        )
        return rate if success else None
        
    async def update_plating_rate(self, rate_id: str, data: dict) -> bool:
        """Update a plating rate."""
        return await self.update_row(
            self.SHEETS["plating_rates"],
            self.PLATING_RATE_COLUMNS,
            "rate_id",
            rate_id,
            data
        )

    async def get_plating_jobs(self, dealer_id: Optional[str] = None) -> list[dict]:
        """Get plating jobs."""
        if dealer_id:
            return await self.filter_rows(
                self.SHEETS["plating_jobs"],
                self.PLATING_JOB_COLUMNS,
                {"dealer_id": dealer_id}
            )
        return await self.get_all_rows(self.SHEETS["plating_jobs"], self.PLATING_JOB_COLUMNS)

    async def create_plating_job(self, data: dict) -> Optional[dict]:
        """Create a new plating job."""
        job_id = await self.get_next_id(self.SHEETS["plating_jobs"], "JOB")
        now = datetime.now().isoformat()
        
        job = {
            **data,
            "job_id": job_id,
            "status": "Assigned",
            "start_date": now,
            "created_at": now,
            "updated_at": now,
        }
        
        success = await self.append_row(
            self.SHEETS["plating_jobs"],
            self.PLATING_JOB_COLUMNS,
            job
        )
        return job if success else None

    async def update_plating_job(self, job_id: str, data: dict) -> bool:
        """Update a plating job."""
        return await self.update_row(
            self.SHEETS["plating_jobs"],
            self.PLATING_JOB_COLUMNS,
            "job_id",
            job_id,
            data
        )
