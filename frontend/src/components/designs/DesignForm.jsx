import { useState, useEffect } from 'react'
import { designsApi, designersApi } from '../../services/api'
import { X } from 'lucide-react'

export default function DesignForm({ isOpen, onClose, onSuccess, initialData = null }) {
    const [loading, setLoading] = useState(false)
    const [designers, setDesigners] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        designer_id: '',
        base_design_cost: 0,
        notes: '',
    })

    useEffect(() => {
        if (isOpen) {
            fetchDesigners()
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    category: initialData.category,
                    designer_id: initialData.designer_id || '',
                    base_design_cost: initialData.base_design_cost || 0,
                    notes: initialData.notes || '',
                })
            } else {
                setFormData({
                    name: '',
                    category: '',
                    designer_id: '',
                    base_design_cost: 0,
                    notes: '',
                })
            }
        }
    }, [isOpen, initialData])

    const fetchDesigners = async () => {
        try {
            const response = await designersApi.list()
            // Assuming response is an array or { designers: [] }
            setDesigners(response.designers || response || [])
        } catch (err) {
            console.error('Failed to load designers', err)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'base_design_cost' ? parseFloat(value) || 0 : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (initialData) {
                await designsApi.update(initialData.design_id, formData)
            } else {
                await designsApi.create(formData)
            }
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving design:', error)
            alert('Failed to save design')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Design' : 'New Design'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Design Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. Royal Antique Necklace"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Select Category</option>
                            <option value="Necklace">Necklace</option>
                            <option value="Bangles">Bangles</option>
                            <option value="Earrings">Earrings</option>
                            <option value="Rings">Rings</option>
                            <option value="Pendants">Pendants</option>
                            <option value="Chains">Chains</option>
                            <option value="Mukut">Mukut</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designer
                        </label>
                        <select
                            name="designer_id"
                            value={formData.designer_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">None</option>
                            {designers.map(d => (
                                <option key={d.designer_id} value={d.designer_id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Base Design Cost (₹)
                        </label>
                        <input
                            type="number"
                            name="base_design_cost"
                            min="0"
                            step="0.01"
                            value={formData.base_design_cost}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This cost will be applied as default to new variants.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            rows="3"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
