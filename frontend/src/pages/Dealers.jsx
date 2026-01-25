/**
 * Dealers Page - Premium List
 */

import { useState, useEffect } from 'react'
import {
    HiPlus,
    HiSearch,
    HiUserGroup,
    HiPhone,
    HiLocationMarker,
    HiDotsVertical,
    HiTrash,
    HiPencil
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import { dealersApi } from '../services/api'

export default function Dealers() {
    const [dealers, setDealers] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('BUY') // BUY (Suppliers) or SELL (Customers)
    const [showModal, setShowModal] = useState(false)
    const [editingDealer, setEditingDealer] = useState(null)

    const [form, setForm] = useState({
        name: '',
        dealer_type: 'BUY', // BUY/SELL
        dealer_category: 'Material',
        gstin: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        notes: ''
    })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await dealersApi.list()
            setDealers(data.dealers || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (editingDealer) await dealersApi.update(editingDealer.dealer_id, form)
            else await dealersApi.create(form)
            setShowModal(false); setForm({}); setEditingDealer(null); loadData()
        } catch (e) {
            console.error(e)
            alert('Failed to save contact. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Delete this contact?')) {
            try { await dealersApi.delete(id); loadData() } catch (e) { console.error(e) }
        }
    }

    const openEdit = (dealer) => {
        setEditingDealer(dealer)
        setForm({ ...dealer })
        setShowModal(true)
    }

    const filteredDealers = dealers.filter(d => d.dealer_type === activeTab)

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contacts</h1>
                    <p className="text-[var(--text-secondary)]">Manage {activeTab === 'BUY' ? 'Suppliers' : 'Customers'} </p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-[var(--border-subtle)]">
                    <button
                        onClick={() => setActiveTab('BUY')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'BUY' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-body)]'}`}
                    >
                        Suppliers (BUY)
                    </button>
                    <button
                        onClick={() => setActiveTab('SELL')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SELL' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-body)]'}`}
                    >
                        Customers (SELL)
                    </button>
                </div>

                <Button icon={HiPlus} onClick={() => { setEditingDealer(null); setForm({ dealer_type: activeTab, dealer_category: 'Material' }); setShowModal(true) }}>
                    Add {activeTab === 'BUY' ? 'Supplier' : 'Customer'}
                </Button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
                    </div>
                ) : filteredDealers.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-body)] border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Name / Business</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Location</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Balance</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {filteredDealers.map(dealer => (
                                <tr key={dealer.dealer_id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-body)] flex items-center justify-center font-bold text-[var(--text-secondary)]">
                                                {dealer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)]">{dealer.name}</p>
                                                {dealer.gstin && <p className="text-xs text-[var(--text-muted)] font-mono">GST: {dealer.gstin}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {dealer.phone && <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><HiPhone className="w-4 h-4 text-[var(--text-muted)]" /> {dealer.phone}</div>}
                                        {dealer.email && <div className="text-xs text-[var(--text-muted)] ml-6">{dealer.email}</div>}
                                    </td>
                                    <td className="p-5">
                                        {dealer.city && <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><HiLocationMarker className="w-4 h-4 text-[var(--text-muted)]" /> {dealer.city}</div>}
                                    </td>
                                    <td className={`p-5 text-right font-bold ${(dealer.current_balance || 0) > 0 ? 'text-green-600' : (dealer.current_balance || 0) < 0 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                        {Math.abs(dealer.current_balance || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        <span className="text-xs font-normal text-gray-400 block">
                                            {(dealer.current_balance || 0) > 0 ? 'Receivable' : (dealer.current_balance || 0) < 0 ? 'Payable' : '-'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <Badge variant="info" size="sm" className="bg-gray-100 text-gray-700">{dealer.category || 'Standard'}</Badge>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(dealer)} className="p-2 hover:bg-white hover:shadow-md rounded-lg text-[var(--text-secondary)] transition-all"><HiPencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(dealer.dealer_id)} className="p-2 hover:bg-white hover:shadow-md rounded-lg text-red-500 transition-all"><HiTrash className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <HiUserGroup className="w-10 h-10" />
                        </div>
                        <h3 className="font-bold text-[var(--text-primary)]">No {activeTab === 'BUY' ? 'Suppliers' : 'Customers'} Found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">Start building your contact list.</p>
                        <Button onClick={() => { setForm({ dealer_type: activeTab, dealer_category: 'Material' }); setShowModal(true) }} icon={HiPlus}>Add Contact</Button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDealer ? 'Edit Contact' : 'Add Contact'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Type" value={form.dealer_type} onChange={e => setForm({ ...form, dealer_type: e.target.value })} options={[{ value: 'BUY', label: 'Supplier (Buy)' }, { value: 'SELL', label: 'Customer (Sell)' }]} />
                        <Select label="Category" value={form.dealer_category} onChange={e => setForm({ ...form, dealer_category: e.target.value })} options={[
                            { value: 'Material', label: 'Material Supplier' },
                            { value: 'Making', label: 'Making Vendor' },
                            { value: 'Plating', label: 'Plating Vendor' },
                            { value: 'Packing', label: 'Packing Vendor' },
                            { value: 'Customer', label: 'Customer' }
                        ]} />
                    </div>
                    <Input label="GSTIN" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" loading={loading} fullWidth>Save Contact</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
