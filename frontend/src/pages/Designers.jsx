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
    HiPhone
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import { designersApi } from '../services/api'

export default function Designers() {
    const [designers, setDesigners] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingDesigner, setEditingDesigner] = useState(null)

    const [form, setForm] = useState({
        name: '',
        contact_phone: '',
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
            setShowModal(false); setForm({ name: '', contact_phone: '' }); setEditingDesigner(null); loadData()
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (confirm('Delete this designer?')) {
            try { await designersApi.delete(id); loadData() } catch (e) { console.error(e) }
        }
    }

    const openEdit = (designer) => {
        setEditingDesigner(designer)
        setForm({
            name: designer.name || '',
            contact_phone: designer.contact_phone || ''
        })
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
                <Button icon={HiPlus} onClick={() => { setEditingDesigner(null); setForm({ name: '', contact_phone: '' }); setShowModal(true) }}>
                    Add Designer
                </Button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : designers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designers.map(designer => (
                        <div key={designer.designer_id} className="card p-6 flex flex-col hover:border-[var(--color-primary-light)] group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-lg">
                                        {designer.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)]">{designer.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)] font-mono">{designer.designer_id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(designer)} className="p-2 text-[var(--text-secondary)] hover:bg-gray-100 rounded-lg"><HiPencil /></button>
                                    <button onClick={() => handleDelete(designer.designer_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><HiTrash /></button>
                                </div>
                            </div>

                            {designer.contact_phone && (
                                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <HiPhone className="w-4 h-4" />
                                    <span>{designer.contact_phone}</span>
                                </div>
                            )}
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

            {/* Modal - Simplified */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDesigner ? 'Edit Designer' : 'Add Designer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Designer name"
                    />
                    <Input
                        label="Phone"
                        value={form.contact_phone}
                        onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                        placeholder="Contact number"
                    />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Save Designer</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
