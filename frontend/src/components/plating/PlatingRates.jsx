import React, { useState, useEffect } from 'react';
import { platingApi } from '../../services/api';
import { HiPlus } from 'react-icons/hi';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const PlatingRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        plating_type: 'B_GOLD',
        rate_per_kg: '',
        effective_from: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        try {
            setLoading(true);
            const data = await platingApi.getRates();
            setRates(data);
        } catch (err) {
            console.error("Failed to load rates", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await platingApi.createRate({
                ...formData,
                rate_per_kg: parseFloat(formData.rate_per_kg)
            });
            setShowForm(false);
            setFormData({
                plating_type: 'B_GOLD',
                rate_per_kg: '',
                effective_from: new Date().toISOString().split('T')[0]
            });
            loadRates();
        } catch (err) {
            alert("Failed to create rate: " + err.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-body)]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Active Plating Rates</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Manage cost per KG for different gold types</p>
                </div>
                <Button icon={HiPlus} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Add Rate'}
                </Button>
            </div>

            {showForm && (
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="w-1/4">
                            <Select
                                label="Type"
                                value={formData.plating_type}
                                onChange={e => setFormData({ ...formData, plating_type: e.target.value })}
                                options={[
                                    { value: 'B_GOLD', label: 'B Gold' },
                                    { value: 'LAKE_GOLD', label: 'Lake Gold' },
                                    { value: 'OTHER', label: 'Other' }
                                ]}
                            />
                        </div>
                        <div className="w-1/4">
                            <Input
                                label="Rate (₹/KG)"
                                type="number"
                                step="0.01"
                                required
                                value={formData.rate_per_kg}
                                onChange={e => setFormData({ ...formData, rate_per_kg: e.target.value })}
                            />
                        </div>
                        <div className="w-1/4">
                            <Input
                                label="Effective From"
                                type="date"
                                required
                                value={formData.effective_from}
                                onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                            />
                        </div>
                        <Button type="submit">Save Rate</Button>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[var(--bg-body)] border-b border-[var(--border-subtle)]">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Type</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Rate / KG</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Effective Date</th>
                            <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {rates.map(rate => (
                            <tr key={rate.rate_id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-[var(--text-primary)]">{rate.plating_type}</td>
                                <td className="p-4 font-bold text-[var(--text-primary)]">₹{rate.rate_per_kg}</td>
                                <td className="p-4 text-[var(--text-secondary)]">{new Date(rate.effective_from).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                        {rate.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {rates.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">
                                    No rates found. Add one to calculate job costs.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlatingRates;
