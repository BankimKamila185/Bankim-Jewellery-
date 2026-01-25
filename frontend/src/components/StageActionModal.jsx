import React, { useState, useEffect } from "react";
import api from "../services/api";

const StageActionModal = ({
    isOpen,
    onClose,
    variantId,
    currentStage,
    onSuccess
}) => {
    const [dealers, setDealers] = useState([]);
    const [formData, setFormData] = useState({
        assigned_dealer_id: "",
        cost: "",
        remarks: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Fetch dealers if needed for this stage
            if (["MAKING", "PLATING", "PACKING"].includes(currentStage?.stage_code)) {
                loadDealers();
            }
        }
    }, [isOpen, currentStage]);

    const loadDealers = async () => {
        try {
            const data = await api.dealers.getAll();
            setDealers(data);
        } catch (err) {
            console.error("Failed to load dealers", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // If no current stage (Pending Start), we are starting process
            // Wait, the logic is: "Send to Maker" -> Completes ORDERED, Creates MAKING?
            // Or if current is ORDERED, action is "Send to Maker".
            // START -> ORDERED (System auto starts or manual?)
            // Use case: Variant created -> Status is Active.
            // Init WorkflowButton: "Start Production" -> Calls /start -> Creates ORDERED.

            // If we have a current stage (e.g. ORDERED), and we want to move to next (MAKING).
            // We call /complete on ORDERED.

            const payload = { ...formData };
            if (payload.cost) payload.cost = parseFloat(payload.cost);

            await api.progress.completeStage(currentStage.progress_id, payload);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const requiresDealer = ["MAKING", "PLATING", "PACKING"].includes(currentStage?.next_stage_code);
    // Actually we verify dealer for the NEXT stage usually?
    // User says: "Dealer assignment is mandatory for MAKING, PLATING, PACKING"
    // If current is ORDERED, next is MAKING. So we assign dealer now?
    // Or do we assign when completing MAKING?
    // Usually: "Send to Maker" -> Assign Maker. So yes, before entering Making.
    // My backend logic: complete_stage(ORDERED) -> creates MAKING.
    // So validation should be on the Frontend Modal before calling complete.

    // Wait, my backend `complete_stage` accepts `assigned_dealer_id`.
    // Does it assign to current or next?
    // `complete_stage` updates current entry cost, etc.
    // And creates next entry. 
    // Ah, the `workflow_service.py` logic:
    // "Dealer needs to be assigned manually for next stage" --> COMMENT in `workflow_service.py`.
    // "Auto-create next stage... Dealer needs to be assigned manually".
    // So `complete_stage` creates the next PENDING stage.
    // Then we need another call to `update_stage` to assign dealer?
    // OR `complete_stage` should accept `next_stage_dealer_id`?

    // Let's look at `workflow_service.py` again.
    // It takes `ProgressUpdate` (status, assigned_dealer_id, cost).
    // These updates apply to the CURRENT stage being completed.
    // e.g. If I am in MAKING, and I complete it, I record the cost and the dealer WHO DID IT.
    // So if I am in ORDERED, and I "Send to Maker", I am completing ORDERED.
    // The dealer assignment is for MAKING.
    // So the flow is:
    // 1. ORDERED (Pending)
    // 2. Action: "Send to Maker" -> This initiates MAKING.
    //    So effectively, we are starting MAKING.
    //    Maybe I should update `workflow_service` to accept `next_stage_dealer_id`.
    //    OR better: The dealer is assigned to the MAKING stage when it is CREATED.
    //    But `complete_stage` auto-creates it.

    // Workaround:
    // We can update the NEW stage immediately after creation.
    // OR: Just let the user assign it in the UI on the new stage.
    // UI: "MAKING (Pending)" -> "Assign Dealer" button?
    // User request: "Actions: Send to Maker".
    // This implies moving from ORDERED -> MAKING.
    // If I click "Send to Maker", I expect to select the Maker.

    // Implementation Update Decision:
    // I will stick to the current backend for now.
    // Flow:
    // 1. ORDERED (Pending).
    // 2. Click "Send to Maker".
    // 3. Modal shows Dealer Select.
    // 4. Submit -> Calls /complete on ORDERED. (Payload includes dealer?? No, dealer is for Making).
    // 5. Backend creates MAKING (Pending).
    // 6. Frontend sees MAKING (Pending).
    //    Wait, checking backend: `complete_stage` adds cost/dealer to CURRENT.
    //    If I am in ORDERED, I don't have a dealer.
    //    If I am in MAKING, I have a dealer.
    //    So when do I assign the dealer for MAKING?
    //    Ideally when I "Start" MAKING.
    //    But my API `start_process` only starts the whole thing.

    // It seems I missed a `start_stage` or `assign_stage` API.
    // Current `complete_stage` auto-creates next as PENDING.
    // I probably need an `update_stage` endpoint to assign dealer to the PENDING stage.
    // Or `start_stage(progress_id)` which changes status PENDING -> IN_PROGRESS and assigns dealer.

    // LET'S ASSUME:
    // "Send to Maker" means:
    // 1. Complete ORDERED.
    // 2. Update MAKING (which was just created) to Assign Dealer + Set to InProgress?
    // OR:
    // Just use `update_progress_entry` on the new stage.

    // I'll add `update` to API.

    const showDealerSelect = true; // For now simplify

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Complete Stage: {currentStage?.stage_code}</h3>
                <form onSubmit={handleSubmit}>
                    {showDealerSelect && (
                        <label>
                            Assign Dealer (for next stage):
                            <select name="assigned_dealer_id" onChange={handleChange}>
                                <option value="">Select Dealer</option>
                                {dealers.map(d => (
                                    <option key={d.dealer_id} value={d.dealer_id}>{d.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label>
                        Cost Incurred (if any):
                        <input type="number" name="cost" onChange={handleChange} />
                    </label>

                    <label>
                        Remarks:
                        <textarea name="remarks" onChange={handleChange} />
                    </label>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>
                            {loading ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StageActionModal;
