/**
 * Designers Page - Premium Grid
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    HiPlus,
    HiSearch,
    HiColorSwatch,
    HiPencil,
    HiTrash,
    HiStar
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import { designersApi } from '../services/api'

export default function Designers() {
    const [designers, setDesigners] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingDesigner, setEditingDesigner] = useState(null)

    const [form, setForm] = useState({
        name: '',
        code: '',
        specialty: 'Gold',
        charge_type: 'Per Gram',
        standard_rate: 0,
        contact_phone: '',
        rating: 5
    })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await designersApi.list()
            setDesigners(data.designers || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingDesigner) await designersApi.update(editingDesigner.designer_id, form)
            else await designersApi.create(form)
            setShowModal(false); setForm({}); setEditingDesigner(null); loadData()
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (confirm('Delete this designer?')) {
            try { await designersApi.delete(id); loadData() } catch (e) { console.error(e) }
        }
    }

    const openEdit = (designer) => {
        setEditingDesigner(designer)
        setForm({ ...designer })
        setShowModal(true)
    }

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Designers</h1>
                    <p className="text-[var(--text-secondary)]">Manage your creative team</p>
                </div>
                <Button icon={HiPlus} onClick={() => { setEditingDesigner(null); setForm({ rating: 5, specialty: 'Gold', charge_type: 'Per Gram' }); setShowModal(true) }}>
                    Add Designer
                </Button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : designers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designers.map(designer => (
                        <div key={designer.designer_id} className="card p-6 flex flex-col hover:border-[var(--color-primary-light)] group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-lg">
                                        {designer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)]">{designer.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)] font-mono">{designer.code}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(designer)} className="p-2 text-[var(--text-secondary)] hover:bg-gray-100 rounded-lg"><HiPencil /></button>
                                    <button onClick={() => handleDelete(designer.designer_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><HiTrash /></button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Specialty</span>
                                    <span className="font-medium text-[var(--text-primary)]">{designer.specialty}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Rate</span>
                                    <span className="font-medium text-[var(--text-primary)]">₹{designer.standard_rate} <span className="text-xs text-[var(--text-muted)]">/ {designer.charge_type === 'Per Gram' ? 'g' : 'pc'}</span></span>
                                </div>
                                {designer.contact_phone && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Contact</span>
                                        <span className="font-medium text-[var(--text-primary)]">{designer.contact_phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <HiStar key={i} className={`w-4 h-4 ${i < (designer.rating || 5) ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
                        <HiColorSwatch className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">No Designers Found</h3>
                    <p className="text-[var(--text-secondary)] mb-6">Add artisans to your network.</p>
                    <Button onClick={() => setShowModal(true)} icon={HiPlus}>Add Designer</Button>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDesigner ? 'Edit Designer' : 'Add Designer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code (Optional)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                        <Input label="Phone" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} options={[{ value: 'Gold', label: 'Gold' }, { value: 'Diamond', label: 'Diamond' }, { value: 'Silver', label: 'Silver' }, { value: 'Platinum', label: 'Platinum' }]} />
                        <Input label="Rating (1-5)" type="number" min="1" max="5" value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })} />
                    </div>
                    <div className="p-4 bg-[var(--bg-body)] rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">Pricing Configuration</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Charge Type" value={form.charge_type} onChange={e => setForm({ ...form, charge_type: e.target.value })} options={[{ value: 'Per Gram', label: 'Per Gram' }, { value: 'Fixed Price', label: 'Fixed Price' }, { value: 'Percentage', label: 'Percentage' }]} />
                            <Input label="Standard Rate (₹)" type="number" value={form.standard_rate} onChange={e => setForm({ ...form, standard_rate: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Save Designer</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
