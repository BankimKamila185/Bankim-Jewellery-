import React, { useState } from 'react'
import { paymentsApi } from '../services/api'
import { X } from 'lucide-react'

const PaymentModal = ({ isOpen, onClose, onSuccess, initialData = {} }) => {
    // initialData contexts: { invoice_id, dealer_id, payment_type, amount, related_to }

    const [formData, setFormData] = useState({
        dealer_id: initialData.dealer_id || '',
        amount: initialData.amount || '',
        payment_mode: 'Cash',
        reference_no: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        ...initialData
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await paymentsApi.create({
                ...formData,
                amount: parseFloat(formData.amount)
            })
            onSuccess()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {formData.payment_type === 'IN' ? 'Receive Payment' : 'Record Payment'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            name="amount"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Mode
                        </label>
                        <select
                            name="payment_mode"
                            value={formData.payment_mode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            name="payment_date"
                            required
                            value={formData.payment_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference No. (Optional)
                        </label>
                        <input
                            type="text"
                            name="reference_no"
                            value={formData.reference_no}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. UPI Ref, OneCheck #..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PaymentModal
