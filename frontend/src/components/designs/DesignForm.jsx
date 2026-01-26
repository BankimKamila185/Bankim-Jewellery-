import { useState, useEffect, useRef } from 'react'
import { designsApi, designersApi } from '../../services/api'
import { X, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function DesignForm({ isOpen, onClose, onSuccess, initialData = null }) {
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [designers, setDesigners] = useState([])
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: '',
        product_code: '',
        category: '',
        designer_id: '',
        base_design_cost: 0,
    })

    useEffect(() => {
        if (isOpen) {
            fetchDesigners()
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    product_code: initialData.product_code || '',
                    category: initialData.category,
                    designer_id: initialData.designer_id || '',
                    base_design_cost: initialData.base_design_cost || 0,
                })
                // Show existing image if available
                if (initialData.image_drive_link) {
                    setImagePreview(initialData.image_drive_link)
                }
            } else {
                setFormData({
                    name: '',
                    product_code: '',
                    category: '',
                    designer_id: '',
                    base_design_cost: 0,
                })
                setImagePreview(null)
                setSelectedFile(null)
            }
        }
    }, [isOpen, initialData])

    const fetchDesigners = async () => {
        try {
            const response = await designersApi.list()
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

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a JPEG, PNG, or WebP image')
                return
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size must be less than 10MB')
                return
            }

            setSelectedFile(file)
            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => setImagePreview(e.target.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            let designId = initialData?.design_id

            if (initialData) {
                // Update existing design
                await designsApi.update(designId, formData)
            } else {
                // Create new design
                const result = await designsApi.create(formData)
                designId = result.design_id
            }

            // Upload image if selected
            if (selectedFile && designId) {
                setUploadingImage(true)
                try {
                    await designsApi.uploadImage(designId, selectedFile)
                } catch (uploadErr) {
                    console.error('Failed to upload image:', uploadErr)
                    alert('Design saved but image upload failed: ' + uploadErr.message)
                }
                setUploadingImage(false)
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving design:', error)
            alert('Failed to save design: ' + error.message)
        } finally {
            setLoading(false)
            setUploadingImage(false)
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
                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Image
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-400 cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-contain rounded-lg"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                        <span className="text-white font-medium">Click to change</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <span className="text-sm font-medium">Click to upload image</span>
                                    <span className="text-xs mt-1">JPEG, PNG, WebP (max 10MB)</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                    </div>

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
                            Product Code
                        </label>
                        <input
                            type="text"
                            name="product_code"
                            value={formData.product_code}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. BJ-NK-001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <input
                            type="text"
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. Necklace, Bangles, Earrings"
                        />
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
                            Labour Cost (₹)
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
                            disabled={loading || uploadingImage}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {(loading || uploadingImage) && <Loader2 className="w-4 h-4 animate-spin" />}
                            {uploadingImage ? 'Uploading Image...' : loading ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
