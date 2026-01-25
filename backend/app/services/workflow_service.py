"""
Workflow Service - Logic for product progress tracking.
"""

from datetime import datetime
from typing import Optional, List

from app.services.sheets_service import SheetsService
from app.models.workflow import (
    WorkflowStage, ProductProgress, ProgressCreate, ProgressUpdate, ProgressStatus
)

class WorkflowService:
    """Service for managing product workflow stages."""

    # Default Workflow Stages (fallback if sheet is empty)
    DEFAULT_STAGES = [
        {"stage_order": 1, "stage_code": "ORDERED", "display_name": "Ordered", "is_final_stage": False},
        {"stage_order": 2, "stage_code": "MAKING", "display_name": "Making", "is_final_stage": False},
        {"stage_order": 3, "stage_code": "PLATING", "display_name": "Plating", "is_final_stage": False},
        {"stage_order": 4, "stage_code": "QUALITY_CHECK", "display_name": "Quality Check", "is_final_stage": False},
        {"stage_order": 5, "stage_code": "PACKING", "display_name": "Packing", "is_final_stage": False},
        {"stage_order": 6, "stage_code": "READY_TO_DISPATCH", "display_name": "Ready to Dispatch", "is_final_stage": False},
        {"stage_order": 7, "stage_code": "DELIVERED", "display_name": "Delivered", "is_final_stage": True},
    ]

    def __init__(self, sheets_service: SheetsService):
        self.sheets = sheets_service

    async def get_stages(self) -> List[WorkflowStage]:
        """Get all configured workflow stages."""
        rows = await self.sheets.get_workflow_stages()
        if not rows:
            # Return defaults if not configured in sheet
            return [WorkflowStage(**s) for s in self.DEFAULT_STAGES]
        return [WorkflowStage(**row) for row in rows]

    async def get_next_stage(self, current_stage_code: str) -> Optional[WorkflowStage]:
        """Get the next stage after the current one."""
        stages = await self.get_stages()
        
        # Find current index
        idx = -1
        for i, stage in enumerate(stages):
            if stage.stage_code == current_stage_code:
                idx = i
                break
        
        if idx != -1 and idx + 1 < len(stages):
            return stages[idx + 1]
        return None

    async def start_process(self, data: ProgressCreate) -> Optional[ProductProgress]:
        """Start the workflow process for a variant (First Stage)."""
        # Ensure variant exists
        variant = await self.sheets.get_variant(data.variant_id)
        if not variant:
            raise ValueError(f"Variant {data.variant_id} not found")

        # Create entry
        entry_data = data.model_dump()
        entry_data["design_id"] = variant.get("design_id")
        entry_data["status"] = ProgressStatus.PENDING.value
        entry_data["start_date"] = datetime.now().isoformat()
        
        created = await self.sheets.create_progress_entry(entry_data)
        if created:
            return ProductProgress(**created)
        return None

    async def complete_stage(self, progress_id: str, data: ProgressUpdate) -> Optional[ProductProgress]:
        """Complete a stage and trigger the next one."""
        # Get current entry
        all_rows = await self.sheets.get_all_rows(
            self.sheets.SHEETS["product_progress"],
            self.sheets.PRODUCT_PROGRESS_COLUMNS
        )
        current_entry = None
        for row in all_rows:
            if row.get("progress_id") == progress_id:
                current_entry = row
                break
        
        if not current_entry:
            return None

        # Update current stage to Completed
        updates = data.model_dump(exclude_unset=True)
        updates["status"] = ProgressStatus.COMPLETED.value
        updates["end_date"] = datetime.now().isoformat()
        
        # If cost is added, update product cost breakdown
        if updates.get("cost") and float(updates["cost"]) > 0:
            await self._add_cost_to_variant(
                current_entry["variant_id"], 
                current_entry["stage_code"],
                float(updates["cost"]),
                updates.get("assigned_dealer_id")
            )

        success = await self.sheets.update_progress_entry(progress_id, updates)
        if not success:
            return None

        # Auto-create next stage
        next_stage = await self.get_next_stage(current_entry["stage_code"])
        if next_stage:
            new_stage_data = {
                "variant_id": current_entry["variant_id"],
                "design_id": current_entry["design_id"],
                "stage_code": next_stage.stage_code,
                "quantity": current_entry["quantity"], # Carry forward quantity
                "status": ProgressStatus.PENDING.value,
                "start_date": datetime.now().isoformat(),
                # Dealer needs to be assigned manually for next stage
            }
            await self.sheets.create_progress_entry(new_stage_data)

        # Retrieve updated object
        # ... refetching logic could be added, but for now return updated dict wrapper
        updated_dict = {**current_entry, **updates, "updated_at": datetime.now().isoformat()}
        return ProductProgress(**updated_dict)

    async def _add_cost_to_variant(self, variant_id: str, stage_code: str, amount: float, dealer_id: str = None):
        """Add cost to variant based on stage."""
        # Map stage to cost type
        cost_map = {
            "MAKING": "making_cost",
            "PLATING": "finishing_cost",
            "PACKING": "packing_cost",
        }
        
        field = cost_map.get(stage_code)
        if not field:
            return

        variant = await self.sheets.get_variant(variant_id)
        if variant:
            current_cost = float(variant.get(field, 0) or 0)
            new_cost = current_cost + amount
            await self.sheets.update_variant(variant_id, {field: new_cost})
            
            # TODO: Also log to CostBreakdown sheet if needed
