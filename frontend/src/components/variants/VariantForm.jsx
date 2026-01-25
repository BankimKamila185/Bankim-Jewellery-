import { useState, useEffect } from 'react'
import { variantsApi } from '../../services/api'
import { X, Upload, Camera } from 'lucide-react'

export default function VariantForm({ isOpen, onClose, onSuccess, designId, initialData = null }) {
    const [loading, setLoading] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)

    const [formData, setFormData] = useState({
        variant_code: '',
        size: '',
        finish: 'Gold',
        material_cost: 0,
        making_cost: 0,
        finishing_cost: 0,
        packing_cost: 0,
        design_cost: 0,
        design_cost: 0,
        stock_qty: 0,
        notes: '',
    })

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    variant_code: initialData.variant_code || '',
                    size: initialData.size || '',
                    finish: initialData.finish || 'Gold',
                    material_cost: initialData.material_cost || 0,
                    making_cost: initialData.making_cost || 0,
                    finishing_cost: initialData.finishing_cost || 0,
                    packing_cost: initialData.packing_cost || 0,
                    design_cost: initialData.design_cost || 0,
                    design_cost: initialData.design_cost || 0,
                    stock_qty: initialData.stock_qty || 0,
                    notes: initialData.notes || '',
                })
                setImagePreview(initialData.image_drive_link)
            } else {
                // Reset form
                setFormData({
                    variant_code: '',
                    size: '',
                    finish: 'Gold',
                    material_cost: 0,
                    making_cost: 0,
                    finishing_cost: 0,
                    packing_cost: 0,
                    design_cost: 0, // Should ideally come from Design base cost
                    design_cost: 0, // Should ideally come from Design base cost
                    stock_qty: 0,
                    notes: '',
                })
                setImagePreview(null)
            }
            setImageFile(null)
        }
    }, [isOpen, initialData, designId])

    const handleChange = (e) => {
        const { name, value } = e.target
        // Handle numeric fields
        const numericFields = [
            'material_cost', 'making_cost', 'finishing_cost',
            'packing_cost', 'design_cost', 'stock_qty'
        ]

        setFormData(prev => ({
            ...prev,
            [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            let variantId = initialData?.variant_id

            const payload = { ...formData, design_id: designId }

            if (initialData) {
                await variantsApi.update(variantId, payload)
            } else {
                const response = await variantsApi.create(payload)
                variantId = response.variant_id
            }

            // Upload image if selected
            if (imageFile && variantId) {
                await variantsApi.uploadImage(variantId, imageFile)
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving variant:', error)
            alert('Failed to save variant')
        } finally {
            setLoading(false)
        }
    }

    // Calculate totals for preview
    const totalCost =
        formData.material_cost +
        formData.making_cost +
        formData.finishing_cost +
        formData.packing_cost +
        formData.design_cost

    // Price logic moved to Invoice
    const profit = 0
    const margin = 0

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Variant' : 'New Variant'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Left Column: Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variant Code</label>
                            <input
                                type="text"
                                name="variant_code"
                                required
                                value={formData.variant_code}
                                onChange={handleChange}
                                placeholder="e.g. AM001"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                <input
                                    type="text"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
                                <select
                                    name="finish"
                                    value={formData.finish}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Mix">Mix</option>
                                    <option value="Antique">Antique</option>
                                    <option value="Rose Gold">Rose Gold</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Variant Image</label>
                            <div className="flex items-center gap-4">
                                <div className="h-24 w-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="variant-image"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="variant-image"
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Choose Image
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, WebP</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Costs & Price */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Cost Breakdown</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">Material Cost</label>
                                <input type="number" name="material_cost" value={formData.material_cost} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Making Cost</label>
                                <input type="number" name="making_cost" value={formData.making_cost} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Finishing Cost</label>
                                <input type="number" name="finishing_cost" value={formData.finishing_cost} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Packing Cost</label>
                                <input type="number" name="packing_cost" value={formData.packing_cost} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500">Design Cost</label>
                                <input type="number" name="design_cost" value={formData.design_cost} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium">Final Cost</span>
                            <span className="text-lg font-bold">₹{totalCost.toFixed(2)}</span>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Selling Price Removed - Defined in Sales Invoice */}
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg">
                            Selling Price is determined at the time of Sales Invoice creation.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                            <input type="number" name="stock_qty" value={formData.stock_qty} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="col-span-1 md:col-span-2 flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Variant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
