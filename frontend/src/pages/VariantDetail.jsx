import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { variantsApi, progressApi, designsApi } from "../services/api";
import WorkflowTimeline from "../components/WorkflowTimeline";
import StageActionModal from "../components/StageActionModal";
import PaymentModal from "../components/PaymentModal";

const VariantDetail = () => {
    const { variantId } = useParams();
    const navigate = useNavigate();

    const [variant, setVariant] = useState(null);
    const [design, setDesign] = useState(null);
    const [history, setHistory] = useState([]);
    const [currentStage, setCurrentStage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentStage, setPaymentStage] = useState(null);

    useEffect(() => {
        fetchData();
    }, [variantId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Variant Details
            const variantData = await variantsApi.get(variantId);
            setVariant(variantData);

            // Fetch Design Details (for context)
            if (variantData.design_id) {
                const designData = await designsApi.get(variantData.design_id);
                setDesign(designData);
            }

            // Fetch Progress History
            const historyData = await progressApi.getVariantHistory(variantId);
            setHistory(historyData);

            // Get Current Stage
            try {
                const currentData = await progressApi.getCurrentStage(variantId);
                setCurrentStage(currentData);
            } catch (err) {
                // If 404, implies Not Started
                setCurrentStage(null);
            }

        } catch (error) {
            console.error("Failed to fetch variant details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartProduction = async () => {
        try {
            await progressApi.startProcess({
                variant_id: variantId,
                stage_code: "ORDERED",
                quantity: variant.stock_qty || 1, // Default to stock qty or 1
                remarks: "Started Production"
            });
            fetchData();
        } catch (err) {
            alert("Failed to start production: " + err.message);
        }
    };

    const handleActionComplete = () => {
        fetchData();
    };

    const handleAddPayment = (stage) => {
        setPaymentStage(stage);
        setPaymentModalOpen(true);
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!variant) return <div className="error">Variant not found</div>;

    const isNotStarted = history.length === 0;

    // Determine Header Actions
    let actionButton = null;
    if (isNotStarted) {
        actionButton = (
            <button className="btn-primary" onClick={handleStartProduction}>
                Start Production
            </button>
        );
    } else if (currentStage && currentStage.stage_code !== "DELIVERED") {
        let actionLabel = "Next Stage";
        if (currentStage.stage_code === "ORDERED") actionLabel = "Send to Maker";
        if (currentStage.stage_code === "MAKING") actionLabel = "Send to Plating";
        if (currentStage.stage_code === "PLATING") actionLabel = "Send to QC";
        if (currentStage.stage_code === "QUALITY_CHECK") actionLabel = "Pack Product";
        if (currentStage.stage_code === "PACKING") actionLabel = "Ready to Dispatch";
        if (currentStage.stage_code === "READY_TO_DISPATCH") actionLabel = "Deliver";

        actionButton = (
            <button className="btn-primary" onClick={() => setActionModalOpen(true)}>
                {actionLabel}
            </button>
        );
    }

    return (
        <div className="page-container variant-detail-page">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
                <h1>{variant.variant_code}</h1>
                <div className="header-actions">
                    {actionButton}
                </div>
            </header>

            <div className="content-grid">
                <div className="details-card">
                    <h2>Variant Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Design</label>
                            <span>{design?.name || variant.design_id}</span>
                        </div>
                        <div className="info-item">
                            <label>Size</label>
                            <span>{variant.size}</span>
                        </div>
                        <div className="info-item">
                            <label>Finish</label>
                            <span>{variant.finish}</span>
                        </div>
                        <div className="info-item">
                            <label>Stock Qty</label>
                            <span>{variant.stock_qty}</span>
                        </div>
                        <div className="info-item">
                            <label>Selling Price</label>
                            <span>₹{variant.selling_price}</span>
                        </div>
                        <div className="info-item">
                            <label>Final Cost</label>
                            <span>₹{variant.final_cost}</span>
                        </div>
                        <div className="info-item">
                            <label>Profit</label>
                            <span className={variant.profit > 0 ? "profit-pos" : "profit-neg"}>
                                ₹{variant.profit} ({variant.profit_margin}%)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="workflow-section">
                    <WorkflowTimeline
                        history={history}
                        onAddPayment={handleAddPayment}
                    />
                </div>
            </div>

            <StageActionModal
                isOpen={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                variantId={variantId}
                currentStage={currentStage}
                onSuccess={handleActionComplete}
            />

            {paymentModalOpen && paymentStage && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onSuccess={handleActionComplete}
                    initialData={{
                        dealer_id: paymentStage.assigned_dealer_id,
                        amount: paymentStage.cost,
                        payment_type: 'OUT',
                        related_to: 'PROGRESS',
                        progress_id: paymentStage.progress_id,
                        notes: `Payment for ${paymentStage.stage_code} of ${variant.variant_code}`
                    }}
                />
            )}
        </div>
    );
};

export default VariantDetail;
