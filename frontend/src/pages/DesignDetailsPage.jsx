import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { designsApi, variantsApi } from '../services/api'
import { Plus, Edit, ArrowLeft, Trash2, Activity } from 'lucide-react'

import VariantForm from '../components/variants/VariantForm'
import DesignForm from '../components/designs/DesignForm'

export default function DesignDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [design, setDesign] = useState(null)
    const [variants, setVariants] = useState([])
    const [loading, setLoading] = useState(true)

    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
    const [isDesignModalOpen, setIsDesignModalOpen] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [designRes, variantsRes] = await Promise.all([
                designsApi.get(id),
                designsApi.getVariants(id)
            ])
            setDesign(designRes)
            setVariants(variantsRes || [])
        } catch (error) {
            console.error('Error fetching details:', error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleDeleteDesign = async () => {
        if (window.confirm('Are you sure you want to delete this design?')) {
            try {
                await designsApi.delete(id)
                navigate('/designs')
            } catch (error) {
                alert('Failed to delete design')
            }
        }
    }

    const handleDeleteVariant = async (variantId) => {
        if (window.confirm('Are you sure you want to delete this variant?')) {
            try {
                await variantsApi.delete(variantId)
                fetchData()
            } catch (error) {
                alert('Failed to delete variant')
            }
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!design) return <div className="p-8 text-center text-red-500">Design not found</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/designs')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{design.name}</h1>
                    <p className="text-sm text-gray-500">{design.design_id} • {design.category}</p>
                </div>
                <button
                    onClick={() => setIsDesignModalOpen(true)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={handleDeleteDesign}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Base Design Cost</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">₹{design.base_design_cost?.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Variants</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{variants.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${design.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {design.status}
                    </span>
                </div>
            </div>

            {/* Variants Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Product Variants</h2>
                    <button
                        onClick={() => { setSelectedVariant(null); setIsVariantModalOpen(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Variant
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Image</th>
                                <th className="px-6 py-3 font-medium">Code</th>
                                <th className="px-6 py-3 font-medium">Finish</th>
                                <th className="px-6 py-3 font-medium">Cost</th>
                                <th className="px-6 py-3 font-medium">Stock</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {variants.map((variant) => (
                                <tr key={variant.variant_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            {variant.image_drive_link ? (
                                                <img src={variant.image_drive_link} alt="v" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">No Img</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{variant.variant_code}</td>
                                    <td className="px-6 py-3 text-gray-600">{variant.finish}</td>
                                    <td className="px-6 py-3 text-gray-600">₹{variant.final_cost?.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${variant.stock_qty > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {variant.stock_qty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 flex gap-2">
                                        <button
                                            onClick={() => navigate(`/variants/${variant.variant_id}`)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Track Progress"
                                        >
                                            <Activity className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedVariant(variant); setIsVariantModalOpen(true); }}
                                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVariant(variant.variant_id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {variants.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No variants created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <VariantForm
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                onSuccess={fetchData}
                designId={id}
                initialData={selectedVariant}
            />

            <DesignForm
                isOpen={isDesignModalOpen}
                onClose={() => setIsDesignModalOpen(false)}
                onSuccess={fetchData}
                initialData={design}
            />
        </div>
    )
}
