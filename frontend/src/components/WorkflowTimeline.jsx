import React, { useEffect, useState } from "react";
import "./WorkflowTimeline.css"; // We'll need to create this CSS or add to index.css

const STAGE_ORDER = [
    "ORDERED",
    "MAKING",
    "PLATING",
    "QUALITY_CHECK",
    "PACKING",
    "READY_TO_DISPATCH",
    "DELIVERED"
];

const WorkflowTimeline = ({ history, onAddPayment }) => {
    if (!history || history.length === 0) return <div>No history</div>;

    // We want to show all defined stages, and highlight the ones completed/active
    // Sort history by date desc
    const sortedHistory = [...history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Create a map for easy lookup
    const stageMap = {};
    history.forEach(entry => {
        stageMap[entry.stage_code] = entry;
    });

    return (
        <div className="workflow-timeline">
            <h3>Production Progress</h3>
            <div className="timeline-container">
                {STAGE_ORDER.map((stageCode, index) => {
                    const entry = stageMap[stageCode];
                    const isCompleted = entry && entry.status === "Completed";
                    const isActive = entry && (entry.status === "Pending" || entry.status === "InProgress");
                    const isFuture = !entry;

                    let statusClass = "future";
                    if (isCompleted) statusClass = "completed";
                    if (isActive) statusClass = "active";

                    return (
                        <div key={stageCode} className={`timeline-item ${statusClass}`}>
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <h4>{stageCode.replace(/_/g, " ")}</h4>
                                    {entry && <span className="timeline-date">{new Date(entry.created_at).toLocaleDateString()}</span>}
                                </div>
                                {entry && (
                                    <div className="timeline-details">
                                        <p className="status-badge">{entry.status}</p>
                                        {entry.quantity > 0 && <p>Qty: {entry.quantity}</p>}
                                        {entry.assigned_dealer_id && <p>Dealer Assigned</p>} {/* Could lookup name if we had list */}
                                        {entry.cost > 0 && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <p>Cost: ₹{entry.cost}</p>
                                                <button
                                                    className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                                                    onClick={() => onAddPayment(entry)}
                                                >
                                                    Pay
                                                </button>
                                            </div>
                                        )}
                                        {entry.remarks && <p className="remarks">"{entry.remarks}"</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkflowTimeline;
