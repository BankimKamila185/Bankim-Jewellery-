/**
 * Materials Page - Raw Items Management
 */

import { useState, useEffect } from 'react'
import {
    HiPlus,
    HiSearch,
    HiCube,
    HiFilter,
    HiPencil,
    HiTrash,
    HiShoppingCart
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import { materialsApi, dealersApi, invoicesApi } from '../services/api'

// Categories matching backend
const categories = [
    { value: 'Metal', label: 'Metal (Gold, Silver)' },
    { value: 'Stone', label: 'Stone (Diamond, AD)' },
    { value: 'Consumable', label: 'Consumable' },
    { value: 'Packing', label: 'Packing Material' },
    { value: 'Other', label: 'Other' },
]

const units = [
    { value: 'gm', label: 'Gram (gm)' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'ct', label: 'Carat (ct)' },
]

export default function Materials() {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState(null)
    const [filter, setFilter] = useState({ category: '', search: '', lowStock: false })

    // Purchase State
    const [purchaseForm, setPurchaseForm] = useState({
        dealer_id: '',
        material_id: '',
        quantity: 0,
        unit_price: 0,
        dealer_id: '',
        material_id: '',
        quantity: 0,
        unit_price: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        bill_number: '',
        notes: ''
    })
    const [dealers, setDealers] = useState([])

    // Form State
    const [form, setForm] = useState({
        name: '',
        category: 'Metal',
        unit: 'gm',
        current_stock: 0,
        min_stock_alert: 10,
        notes: '',
        status: 'Active'
    })

    useEffect(() => {
        loadData()
        loadDealers()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const response = await materialsApi.list()
            setMaterials(response.materials || [])
        } catch (error) {
            console.error('Failed to load materials:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadDealers = async () => {
        try {
            const response = await dealersApi.list({ dealer_type: 'BUY', dealer_category: 'Material' })
            setDealers(response.dealers || [])
        } catch (error) {
            console.error('Failed to load dealers:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingMaterial) await materialsApi.update(editingMaterial.material_id, form)
            else await materialsApi.create(form)
            setShowModal(false); resetForm(); loadData()
        } catch (error) { console.error('Save failed', error) }
    }

    const handlePurchase = async (e) => {
        e.preventDefault()
        try {
            // Call backend purchase endpoint
            await api.post(`/materials/${purchaseForm.material_id}/purchase`, {
                dealer_id: purchaseForm.dealer_id,
                quantity: parseFloat(purchaseForm.quantity),
                unit_price: parseFloat(purchaseForm.unit_price),
                purchase_date: purchaseForm.purchase_date,
                bill_number: purchaseForm.bill_number,
                notes: purchaseForm.notes
            })

            setShowPurchaseModal(false)
            setPurchaseForm({
                dealer_id: '',
                material_id: '',
                quantity: 0,
                unit_price: 0,
                purchase_date: new Date().toISOString().split('T')[0],
                bill_number: '',
                notes: ''
            })
            loadData()

        } catch (error) { console.error('Purchase failed', error); alert('Purchase failed') }
    }

    const handleDelete = async (id) => {
        if (confirm('Delete this material?')) {
            try { await materialsApi.delete(id); loadData() } catch (e) { console.error(e) }
        }
    }

    const resetForm = () => {
        setForm({ name: '', category: 'Metal', unit: 'gm', current_stock: 0, min_stock_alert: 10, notes: '', status: 'Active' })
        setEditingMaterial(null)
    }

    const openEdit = (material) => {
        setEditingMaterial(material)
        setForm({ ...material })
        setShowModal(true)
    }

    const openPurchase = (material = null) => {
        if (material) setPurchaseForm({ ...purchaseForm, material_id: material.material_id })
        setShowPurchaseModal(true)
    }

    const filteredMaterials = materials.filter(m => {
        if (filter.category && m.category !== filter.category) return false
        if (filter.lowStock && parseFloat(m.current_stock) > parseFloat(m.min_stock_alert)) return false
        if (filter.search) {
            const s = filter.search.toLowerCase()
            return m.name?.toLowerCase().includes(s)
        }
        return true
    })

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Raw Materials</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Manage Gold, Silver, Stones, etc.</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filter.search}
                            onChange={e => setFilter({ ...filter, search: e.target.value })}
                            className="pl-10 pr-4 py-2 bg-[var(--bg-body)] rounded-xl text-sm w-full md:w-64 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-light)] outline-none border border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={filter.category}
                        onChange={e => setFilter({ ...filter, category: e.target.value })}
                        className="px-4 py-2 bg-[var(--bg-body)] rounded-xl text-sm font-medium outline-none border border-transparent cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>

                    <Button icon={HiShoppingCart} variant="secondary" onClick={() => openPurchase()}>Purchase</Button>
                    <Button icon={HiPlus} onClick={() => setShowModal(true)}>Add Material</Button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--bg-body)] border-b border-[var(--border-subtle)]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Current Stock</th>
                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Last Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredMaterials.map(material => (
                            <tr key={material.material_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-[var(--text-primary)]">{material.name}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-mono">{material.material_id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={material.category === 'Metal' ? 'warning' : 'neutral'}>{material.category}</Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`font-bold ${parseFloat(material.current_stock) <= parseFloat(material.min_stock_alert) ? 'text-red-500' : 'text-green-600'}`}>
                                        {material.current_stock} <span className="text-xs text-gray-400">{material.unit}</span>
                                    </div>
                                    {parseFloat(material.current_stock) <= parseFloat(material.min_stock_alert) && (
                                        <div className="text-[10px] text-red-500 font-bold uppercase">Low Stock</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right font-mono">
                                    ₹{material.last_purchase_price || 0}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <button onClick={() => openPurchase(material)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Purchase Stock">
                                        <HiShoppingCart className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => openEdit(material)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <HiPencil className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(material.material_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredMaterials.length === 0 && (
                    <div className="p-8 text-center text-[var(--text-secondary)]">No materials found.</div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title={editingMaterial ? 'Edit Material' : 'Add New Material'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Material Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={categories} />
                        <Select label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} options={units} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Current Stock" type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: parseFloat(e.target.value) })} />
                        <Input label="Low Stock Alert" type="number" value={form.min_stock_alert} onChange={e => setForm({ ...form, min_stock_alert: parseFloat(e.target.value) })} />
                    </div>
                    <Input label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>{editingMaterial ? 'Save Changes' : 'Create Material'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Purchase Modal */}
            <Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Purchase Material">
                <form onSubmit={handlePurchase} className="space-y-4">
                    <Select
                        label="Supplier (Shop)"
                        value={purchaseForm.dealer_id}
                        onChange={e => setPurchaseForm({ ...purchaseForm, dealer_id: e.target.value })}
                        options={[{ value: '', label: 'Select Shop' }, ...dealers.map(d => ({ value: d.dealer_id, label: d.name }))]}
                        required
                    />
                    <Select
                        label="Material"
                        value={purchaseForm.material_id}
                        onChange={e => setPurchaseForm({ ...purchaseForm, material_id: e.target.value })}
                        options={[{ value: '', label: 'Select Material' }, ...materials.map(m => ({ value: m.material_id, label: m.name }))]}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Quantity" type="number" value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: parseFloat(e.target.value) })} required />
                        <Input label="Unit Price" type="number" value={purchaseForm.unit_price} onChange={e => setPurchaseForm({ ...purchaseForm, unit_price: parseFloat(e.target.value) })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} />
                        <Input label="Bill Number" value={purchaseForm.bill_number} onChange={e => setPurchaseForm({ ...purchaseForm, bill_number: e.target.value })} placeholder="Optional" />
                    </div>
                    <Input label="Notes" value={purchaseForm.notes} onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="Optional notes" />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowPurchaseModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Confirm Purchase</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
