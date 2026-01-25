import React, { useState, useEffect } from 'react';
import { platingApi, variantsApi } from '../../services/api';
// Wait, the Requirement says: "Active Plating Jobs... Actions: Mark Completed".
// "Add Job" is usually done via Variant Detail or here?
// Implementation Plan said: "Assign to Plating Vendor...".
// I'll add a simple "Assign Job" modal here too if needed, but primarily list jobs.

import { HiCheck, HiSearch, HiRefresh } from 'react-icons/hi';
import Badge from '../common/Badge';

const PlatingJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const data = await platingApi.getJobs();
            // Filter active? Or showing all?
            // "Active Plating Jobs" section implies Active.
            // But good to see history too.
            // Let's sort active first.
            const sorted = data.sort((a, b) => {
                if (a.status === 'InProgress' && b.status !== 'InProgress') return -1;
                if (a.status !== 'InProgress' && b.status === 'InProgress') return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setJobs(sorted);
        } catch (err) {
            console.error("Failed to load jobs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (jobId) => {
        if (!confirm("Are you sure you want to mark this plating job as completed? This will move the variant to Quality Check.")) return;

        try {
            await platingApi.completeJob(jobId);
            loadJobs();
        } catch (err) {
            alert("Failed to complete job: " + err.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-body)]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Plating Jobs</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Track in-progress and completed jobs</p>
                </div>
                <button onClick={loadJobs} className="p-2 hover:bg-white rounded-lg text-gray-500">
                    <HiRefresh className="w-5 h-5" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[var(--bg-body)] border-b border-[var(--border-subtle)]">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Variant</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Vendor</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Details</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Cost</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Status</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {jobs.map(job => (
                            <tr key={job.job_id} className={`hover:bg-gray-50 ${job.status === 'InProgress' ? 'bg-blue-50/30' : ''}`}>
                                <td className="p-4">
                                    <div className="font-bold text-[var(--text-primary)]">{job.variant_id}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{new Date(job.start_date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 text-[var(--text-primary)]">{job.dealer_id}</td>
                                <td className="p-4 text-sm">
                                    <div><span className="font-medium">Type:</span> {job.plating_type}</div>
                                    <div><span className="font-medium">Wt:</span> {job.weight_in_kg} kg</div>
                                </td>
                                <td className="p-4 text-right font-bold text-[var(--text-primary)]">
                                    ₹{job.calculated_cost?.toFixed(2)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        job.status === 'InProgress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                                        }`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {job.status !== 'Completed' && (
                                        <button
                                            onClick={() => handleComplete(job.job_id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <HiCheck className="w-4 h-4" /> Complete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {jobs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-[var(--text-secondary)]">No active jobs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlatingJobs;
