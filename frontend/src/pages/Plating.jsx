/**
 * Plating Management Module
 */
import { useState, useEffect } from 'react'
import {
    HiFire,
    HiPlus,
    HiSearch,
    HiTruck,
    HiCalculator
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import api, { dealersApi, variantsApi } from '../services/api'

// Plating Api wrapper locally if not in api.js
const platingApi = {
    getRates: () => api.get('/plating/rates'),
    createRate: (data) => api.post('/plating/rates', data),
    getJobs: () => api.get('/plating/jobs'),
    assignJob: (data) => api.post('/plating/jobs', data)
}

const PLATING_TYPES = [
    { value: 'B_GOLD', label: 'B Gold' },
    { value: 'LAKER_GOLD', label: 'Laker Gold' },
    { value: 'ROSE_GOLD', label: 'Rose Gold' },
    { value: 'ANTIQUE', label: 'Antique' },
    { value: 'SILVER', label: 'Silver' },
    { value: 'MATTE_GOLD', label: 'Matte Gold' },
    { value: 'COPPER', label: 'Copper' },
    { value: 'OTHER', label: 'Other (Manual Entry)' }
]

export default function Plating() {
    const [activeTab, setActiveTab] = useState('JOBS') // JOBS | RATES
    const [jobs, setJobs] = useState([])
    const [rates, setRates] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal States
    const [showJobModal, setShowJobModal] = useState(false)
    const [showRateModal, setShowRateModal] = useState(false)

    // Data for Selection
    const [vendors, setVendors] = useState([])
    const [variants, setVariants] = useState([])

    // Forms
    const [jobForm, setJobForm] = useState({
        variant_id: '',
        dealer_id: '',
        plating_type: 'B_GOLD',
        custom_type: '',
        quantity: 0,
        weight_in_kg: 0,
        notes: ''
    })

    const [rateForm, setRateForm] = useState({
        plating_type: 'B_GOLD',
        rate_per_kg: 0,
        vendor_dealer_id: ''
    })

    useEffect(() => {
        loadData()
        loadMasterData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [jobsRes, ratesRes] = await Promise.all([
                platingApi.getJobs(),
                platingApi.getRates()
            ])
            setJobs(jobsRes || [])
            setRates(ratesRes || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const loadMasterData = async () => {
        try {
            const [vRes, dRes] = await Promise.all([
                variantsApi.list(),
                dealersApi.list({ dealer_category: 'Plating' })
            ])
            setVariants(vRes.variants || [])
            setVendors(dRes.dealers || [])
        } catch (e) { console.error(e) }
    }

    const handleCreateJob = async (e) => {
        e.preventDefault()
        try {
            const payload = { ...jobForm }
            if (payload.plating_type === 'OTHER') {
                payload.plating_type = payload.custom_type || 'Custom'
            }
            delete payload.custom_type

            await platingApi.assignJob(payload)
            setShowJobModal(false)
            loadData()
            setJobForm({ variant_id: '', dealer_id: '', plating_type: 'B_GOLD', quantity: 0, weight_in_kg: 0, notes: '' })
        } catch (e) { alert('Failed to assign job') }
    }

    const handleCreateRate = async (e) => {
        e.preventDefault()
        try {
            await platingApi.createRate(rateForm)
            setShowRateModal(false)
            loadData()
        } catch (e) { alert('Failed to create rate') }
    }

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Plating Management</h1>
                    <p className="text-[var(--text-secondary)]">Track jobs and vendor rates</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-[var(--border-subtle)]">
                    <button onClick={() => setActiveTab('JOBS')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'JOBS' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500'}`}>Active Jobs</button>
                    <button onClick={() => setActiveTab('RATES')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'RATES' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500'}`}>Vendor Rates</button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'JOBS' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <div className="relative">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search jobs..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200" />
                        </div>
                        <Button icon={HiPlus} onClick={() => setShowJobModal(true)}>Assign New Job</Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500">Job ID</th>
                                    <th className="p-4 text-xs font-bold text-gray-500">Variant</th>
                                    <th className="p-4 text-xs font-bold text-gray-500">Vendor</th>
                                    <th className="p-4 text-xs font-bold text-gray-500">Type</th>
                                    <th className="p-4 text-xs font-bold text-gray-500">Type</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 text-right">Qty</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 text-right">Weight</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 text-right">Cost</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jobs.map(job => (
                                    <tr key={job.job_id} className="hover:bg-gray-50">
                                        <td className="p-4 font-mono text-xs">{job.job_id}</td>
                                        <td className="p-4">{job.variant_id}</td>
                                        <td className="p-4 text-sm font-medium">{vendors.find(v => v.dealer_id === job.dealer_id)?.name || job.dealer_id}</td>
                                        <td className="p-4"><Badge variant="info">{job.plating_type}</Badge></td>
                                        <td className="p-4 text-right font-mono">{job.quantity || '-'}</td>
                                        <td className="p-4 text-right font-mono">{job.weight_in_kg} kg</td>
                                        <td className="p-4 text-right font-bold text-gray-700">₹{job.calculated_cost}</td>
                                        <td className="p-4 text-center">
                                            <Badge variant={job.status === 'Completed' ? 'success' : 'warning'}>{job.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">No active plating jobs</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'RATES' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button icon={HiPlus} onClick={() => setShowRateModal(true)}>Add Rate</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rates.map(rate => (
                            <Card key={rate.rate_id} className="relative">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{vendors.find(v => v.dealer_id === rate.vendor_dealer_id)?.name || 'Generic Rate'}</h3>
                                        <p className="text-sm text-gray-500">{rate.plating_type}</p>
                                    </div>
                                    <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                                        <HiFire />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-2">
                                    ₹{rate.rate_per_kg} <span className="text-sm text-gray-400 font-normal">/ kg</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Job Modal */}
            <Modal isOpen={showJobModal} onClose={() => setShowJobModal(false)} title="Assign Plating Job">
                <form onSubmit={handleCreateJob} className="space-y-4">
                    <Select
                        label="Variant"
                        value={jobForm.variant_id}
                        onChange={e => setJobForm({ ...jobForm, variant_id: e.target.value })}
                        options={[{ value: '', label: 'Select Variant' }, ...variants.map(v => ({ value: v.variant_id, label: v.variant_code }))]}
                        required
                    />
                    <Select
                        label="Vendor"
                        value={jobForm.dealer_id}
                        onChange={e => setJobForm({ ...jobForm, dealer_id: e.target.value })}
                        options={[{ value: '', label: 'Select Vendor' }, ...vendors.map(v => ({ value: v.dealer_id, label: v.name }))]}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Type" value={jobForm.plating_type} onChange={e => setJobForm({ ...jobForm, plating_type: e.target.value })} options={PLATING_TYPES} />
                        {jobForm.plating_type === 'OTHER' && (
                            <Input
                                label="Custom Type"
                                placeholder="Enter plating name"
                                value={jobForm.custom_type}
                                onChange={e => setJobForm({ ...jobForm, custom_type: e.target.value })}
                                required
                            />
                        )}
                        <Input label="Quantity" type="number" value={jobForm.quantity} onChange={e => setJobForm({ ...jobForm, quantity: parseInt(e.target.value) })} required />
                        <Input label="Weight (KG)" type="number" step="0.001" value={jobForm.weight_in_kg} onChange={e => setJobForm({ ...jobForm, weight_in_kg: parseFloat(e.target.value) })} required />
                    </div>
                    <Input label="Notes" value={jobForm.notes} onChange={e => setJobForm({ ...jobForm, notes: e.target.value })} />

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowJobModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Assign</Button>
                    </div>
                </form>
            </Modal>

            {/* Rate Modal */}
            <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} title="Set Vendor Rate">
                <form onSubmit={handleCreateRate} className="space-y-4">
                    <Select
                        label="Vendor"
                        value={rateForm.vendor_dealer_id}
                        onChange={e => setRateForm({ ...rateForm, vendor_dealer_id: e.target.value })}
                        options={[{ value: '', label: 'Select Vendor' }, ...vendors.map(v => ({ value: v.dealer_id, label: v.name }))]}
                        required
                    />
                    <Select label="Type" value={rateForm.plating_type} onChange={e => setRateForm({ ...rateForm, plating_type: e.target.value })} options={PLATING_TYPES} />
                    <Input label="Rate per KG (₹)" type="number" value={rateForm.rate_per_kg} onChange={e => setRateForm({ ...rateForm, rate_per_kg: parseFloat(e.target.value) })} required />

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowRateModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Save Rate</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
