"""
Plating Service - Logic for plating jobs and rates.
"""

from datetime import datetime
from typing import Optional, List

from app.services.sheets_service import SheetsService
from app.models.plating import (
    PlatingRate, PlatingRateCreate, PlatingAssignment, PlatingJob, JobStatus, PlatingType
)
from app.models.workflow import ProgressStatus, ProgressCreate, ProgressUpdate
from app.services.workflow_service import WorkflowService


class PlatingService:
    def __init__(self, sheets_service: SheetsService, workflow_service: WorkflowService):
        self.sheets = sheets_service
        self.workflow = workflow_service

    # ============ Rates ============

    async def get_rates(self, status: str = "Active") -> List[PlatingRate]:
        rows = await self.sheets.get_plating_rates(status)
        return [PlatingRate(**row) for row in rows]

    async def create_rate(self, data: PlatingRateCreate) -> Optional[PlatingRate]:
        # Deactivate old rates for same type? (Optional business rule)
        # For now, just add new rate
        rate_data = data.model_dump()
        rate_data["effective_from"] = str(data.effective_from)
        rate_data["plating_type"] = data.plating_type.value
        
        created = await self.sheets.create_plating_rate(rate_data)
        return PlatingRate(**created) if created else None

    async def get_active_rate(self, plating_type: PlatingType) -> float:
        """Get the latest active rate for a type."""
        rates = await self.get_rates(status="Active")
        # Filter by type
        matching = [r for r in rates if r.plating_type == plating_type]
        if not matching:
            return 0.0
        # Sort by created_at desc (most recent first)
        matching.sort(key=lambda x: str(x.created_at), reverse=True)
        return matching[0].rate_per_kg

    # ============ Jobs ============

    async def get_jobs(self, dealer_id: Optional[str] = None) -> List[PlatingJob]:
        rows = await self.sheets.get_plating_jobs(dealer_id)
        return [PlatingJob(**row) for row in rows]

    async def assign_job(self, data: PlatingAssignment) -> Optional[PlatingJob]:
        """
        Assign a plating job to a dealer.
        1. Calculate cost.
        2. Create 'PLATING' workflow stage entry.
        3. Create PlatingJob record linking to ProgressID.
        """
        # 1. Calculate Cost
        rate = await self.get_active_rate(data.plating_type)
        cost = rate * data.weight_in_kg

        # 2. Create Workflow Stage (PLATING)
        # We need to manually inject this stage or ensure it follows sequence?
        # Typically Plating follows Making.
        # User Rule: "Plating is ALWAYS a workflow stage".
        # We assume the variant is ready for Plating or we force it?
        # Let's assume we are "Starting" the PLATING stage.
        
        # Check current stage?
        current = await self.sheets.get_current_stage(data.variant_id)
        # If current is MAKING (Completed) or ORDERED?
        # We'll implicitly allow valid transitions.
        
        # Start the stage using start_process? No, start_process is for ORDERED.
        # We need to create a specific stage entry.
        # WorkflowService handles logic, but exposes specific helpers?
        # We can use sheets.create_progress_entry directly for flexibility,
        # linked to Workflow Service logic.
        
        # Use Case: Assign Plating Job -> Creates Metadata for Plating Stage.
        # Ideally, we should update the "Pending" PLATING stage created by previous step.
        # OR create a new one if not exists.
        
        # Find pending PLATING stage
        progress_rows = await self.sheets.get_product_progress(data.variant_id)
        pending_plating = next((p for p in progress_rows if p["stage_code"] == "PLATING" and p["status"] == "Pending"), None)
        
        progress_id = None
        
        if pending_plating:
            progress_id = pending_plating["progress_id"]
            # Update it with Dealer Cost etc?
            # Actually cost is realized upon completion? Or estimation?
            # User says: "Plating cost contributes to product final cost".
            # Usually we set cost when job is assigned (Estimated) or Completed (Actual).
            # Requirement: "Calculate cost = rate * weight".
            
            # Update existing Pending stage
            await self.sheets.update_progress_entry(progress_id, {
                "assigned_dealer_id": data.dealer_id,
                "quantity": data.quantity,
                "status": "InProgress", # Mark as in progress since assigned
                "start_date": datetime.now().isoformat(),
                # We don't set final cost yet? Or do we?
                # Let's set it as estimation or actual if agreed.
                "cost": cost 
            })
            
            # NOTE: workflow_service.complete_stage adds cost to variant. 
            # If we set cost now, `complete_stage` should handle it.
            # But `complete_stage` takes `ProgressUpdate` with cost.
            
        else:
            # Create new stage if not found (e.g. jumped queue)
            # This handles edge cases.
            new_stage = {
                "variant_id": data.variant_id,
                "design_id": data.design_id,
                "stage_code": "PLATING",
                "assigned_dealer_id": data.dealer_id,
                "assigned_dealer_id": data.dealer_id,
                "quantity": data.quantity, # Should fetch from variant?
                "status": "InProgress",
                "start_date": datetime.now().isoformat(),
                "cost": cost
            }
            res = await self.sheets.create_progress_entry(new_stage)
            progress_id = res["progress_id"]

        # 3. Create Plating Job
        job_data = {
            "progress_id": progress_id,
            "variant_id": data.variant_id,
            "design_id": data.design_id,
            "dealer_id": data.dealer_id,
            "quantity": data.quantity,
            "plating_type": data.plating_type, # Using string value directly might be safer if enum logic changed, but .value is correct for Enum
            "weight_in_kg": data.weight_in_kg,
            "rate_per_kg": rate,
            "calculated_cost": cost,
            "status": JobStatus.ASSIGNED.value,
            "start_date": datetime.now().isoformat(),
            "notes": data.notes
        }
        
        created_job = await self.sheets.create_plating_job(job_data)
        return PlatingJob(**created_job) if created_job else None

    async def complete_job(self, job_id: str) -> bool:
        """
        Complete a plating job.
        1. Mark Job as Completed.
        2. Complete Workflow Stage -> Move to Next.
        """
        # Get Job
        all_jobs = await self.get_jobs()
        job = next((j for j in all_jobs if j.job_id == job_id), None)
        if not job:
            return False

        # 1. Update Job
        await self.sheets.update_plating_job(job_id, {
            "status": JobStatus.COMPLETED.value,
            "end_date": datetime.now().isoformat()
        })

        # 2. Complete Workflow Stage
        # Pass cost to be added to variant
        update_data = ProgressUpdate(
            cost=job.calculated_cost, # Confirm final cost
            remarks=f"Plating Completed (Job {job_id})"
        )
        
        await self.workflow.complete_stage(job.progress_id, update_data)
        
        return True
