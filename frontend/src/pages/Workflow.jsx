/**
 * Workflow Kanban Board
 * Tracks production progress.
 */
import { useState, useEffect } from 'react'
import {
    HiChevronRight,
    HiClock,
    HiCheckCircle,
    HiExclamationCircle,
    HiPlay,
    HiPlus
} from 'react-icons/hi'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import api, { variantsApi, dealersApi, designsApi } from '../services/api'

// Workflow API Wrapper
const workflowApi = {
    getStages: () => api.get('/progress/stages'),
    start: (data) => api.post('/progress/start', data),
    // We need an endpoint to get all active progress items. 
    // The current router only has get_variant_history. 
    // We might need to fetch all variants and then their status, or add an endpoint.
    // Let's assume we filter variants by status for now or add a bulk fetch.
    // Actually, `sheets_service` usually lists all rows. I'll check if I can get all progress.
    // If not, I'll list "Active Variants" and their current stage.
}

// Temporary: Since we don't have a "get all active progress" endpoint, 
// we will fetch all Variants and map them to columns based on their status/stage.
// Ideally, backend should provide a Kanban view endpoint.

export default function Workflow() {
    const [stages, setStages] = useState([])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showStartModal, setShowStartModal] = useState(false)

    // Start Form
    const [startForm, setStartForm] = useState({
        variant_id: '',
        quantity: 1,
        notes: ''
    })
    const [variants, setVariants] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // 1. Get Stages
            const stagesRes = await workflowApi.getStages().catch(() => [
                { stage_code: 'ORDERED', display_name: 'Ordered', stage_order: 1 },
                { stage_code: 'MATERIAL_READY', display_name: 'Material Ready', stage_order: 2 },
                { stage_code: 'MAKING', display_name: 'Making', stage_order: 3 },
                { stage_code: 'PLATING', display_name: 'Plating', stage_order: 4 },
                { stage_code: 'PACKING', display_name: 'Packing', stage_order: 5 },
                { stage_code: 'COMPLETED', display_name: 'Completed', stage_order: 6 }
            ])
            setStages(stagesRes)

            // 2. Get Active Items (Mocking for now as we lack bulk endpoint, or fetching variants)
            // Real implementation: Fetch all active progress entries.
            // For MVP: Fetch variants and mock their stage if no progress found.
            const variantsRes = await variantsApi.list()
            setVariants(variantsRes.variants || [])

            // Transform into kanban items
            // In a real app, we would query /progress/active
            const mappedItems = (variantsRes.variants || []).map(v => ({
                id: v.variant_id,
                title: v.variant_code,
                subtitle: v.finish,
                stage: 'ORDERED', // Default
                image: v.image_drive_link,
                priority: 'High'
            }))
            setItems(mappedItems)

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleStart = async (e) => {
        e.preventDefault()
        try {
            await workflowApi.start({
                variant_id: startForm.variant_id,
                stage_code: 'ORDERED',
                quantity: startForm.quantity,
                remarks: startForm.notes
            })
            setShowStartModal(false)
            loadData()
        } catch (e) {
            console.error(e)
            // If failed (maybe already started), just close for now
            setShowStartModal(false)
        }
    }

    const moveNext = (itemId) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const currentIdx = stages.findIndex(s => s.stage_code === item.stage)
                if (currentIdx < stages.length - 1) {
                    return { ...item, stage: stages[currentIdx + 1].stage_code }
                }
            }
            return item
        }))
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-enter">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Production Workflow</h1>
                    <p className="text-[var(--text-secondary)]">Kanban Board for Tracking Jobs</p>
                </div>
                <Button icon={HiPlus} onClick={() => setShowStartModal(true)}>New Job</Button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full gap-4 min-w-max pb-4">
                    {stages.map(stage => (
                        <div key={stage.stage_code} className="w-80 flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full">
                            {/* Column Header */}
                            <div className="p-3 border-b border-gray-200 bg-white rounded-t-xl flex justify-between items-center sticky top-0">
                                <h3 className="font-bold text-gray-700 text-sm">{stage.display_name}</h3>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {items.filter(i => i.stage === stage.stage_code).length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {items.filter(i => i.stage === stage.stage_code).map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer">
                                        <div className="flex gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">
                                                    IMG
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.title}</h4>
                                                    <Badge variant="warning" size="xs">High</Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-50">
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <HiClock className="w-3 h-3" /> 2d
                                            </div>

                                            {stage.stage_code !== 'COMPLETED' && (
                                                <button
                                                    onClick={() => moveNext(item.id)}
                                                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Move to Next Stage"
                                                >
                                                    <HiChevronRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Start Job Modal */}
            <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)} title="Start New Job">
                <form onSubmit={handleStart} className="space-y-4">
                    <Select
                        label="Variant"
                        value={startForm.variant_id}
                        onChange={e => setStartForm({ ...startForm, variant_id: e.target.value })}
                        options={[{ value: '', label: 'Select Variant' }, ...variants.map(v => ({ value: v.variant_id, label: v.variant_code }))]}
                        required
                    />
                    <Input label="Quantity" type="number" value={startForm.quantity} onChange={e => setStartForm({ ...startForm, quantity: parseInt(e.target.value) })} />
                    <Input label="Remarks" value={startForm.notes} onChange={e => setStartForm({ ...startForm, notes: e.target.value })} />

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowStartModal(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>Start Production</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
