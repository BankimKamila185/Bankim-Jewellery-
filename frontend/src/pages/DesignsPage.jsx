import { useState, useEffect } from 'react'
import { designsApi } from '../services/api'
import DesignCard from '../components/designs/DesignCard'
import DesignForm from '../components/designs/DesignForm'
import { Plus } from 'lucide-react'

export default function DesignsPage() {
    const [designs, setDesigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        fetchDesigns()
    }, [])

    const fetchDesigns = async () => {
        try {
            setLoading(true)
            const response = await designsApi.list()
            setDesigns(response.designs || [])
        } catch (err) {
            setError('Failed to load designs')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchDesigns}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Designs</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your master designs catalog</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    <span>New Design</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {designs.map((design) => (
                    <DesignCard key={design.design_id} design={design} />
                ))}
            </div>

            {designs.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No designs found. Create your first design to get started.</p>
                </div>
            )}

            <DesignForm
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchDesigns}
            />
        </div>
    )
}
