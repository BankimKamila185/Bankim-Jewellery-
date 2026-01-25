/**
 * Invoices Page - Premium List View
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    HiPlus,
    HiSearch,
    HiDocumentText,
    HiDotsHorizontal,
    HiFilter,
    HiDownload,
    HiTrash,
    HiCurrencyRupee
} from 'react-icons/hi'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { invoicesApi } from '../services/api'
import PaymentModal from '../components/PaymentModal'

// Helper
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount || 0)
}

export default function Invoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await invoicesApi.list()
            setInvoices(data.invoices || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Delete this invoice?')) {
            try { await invoicesApi.delete(id); loadData() } catch (e) { console.error(e) }
        }
    }

    const handleAddPayment = (invoice) => {
        setSelectedInvoice(invoice)
        setShowPaymentModal(true)
    }

    const handlePaymentSuccess = () => {
        loadData()
        setShowPaymentModal(false)
        setSelectedInvoice(null)
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invoices</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Track sales and payments</p>
                </div>
                <Link to="/invoices/new">
                    <Button icon={HiPlus}>Create Invoice</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--border-subtle)] flex gap-4 items-center">
                <div className="relative flex-1">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by invoice # or customer..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-[var(--bg-body)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    />
                </div>
                <button className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-body)] rounded-xl transition-colors">
                    <HiFilter className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : filteredInvoices.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-body)] border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Invoice</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Amount</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                                <th className="p-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.invoice_id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-5 font-bold text-[var(--text-primary)]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <HiDocumentText className="w-5 h-5" />
                                            </div>
                                            {inv.invoice_number}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="font-medium text-[var(--text-primary)]">{inv.dealer_name || 'Walk-in Customer'}</div>
                                        <div className="text-xs text-[var(--text-muted)]">Client</div>
                                    </td>
                                    <td className="p-5 text-sm text-[var(--text-secondary)]">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <Badge variant="info">{inv.invoice_type}</Badge>
                                    </td>
                                    <td className="p-5 text-right font-bold text-[var(--text-primary)]">{formatMoney(inv.grand_total)}</td>
                                    <td className="p-5 text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${inv.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                                            inv.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {inv.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-[var(--text-secondary)] transition-all" title="Download">
                                                <HiDownload className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2 hover:bg-white hover:shadow-md rounded-lg text-green-600 transition-all"
                                                title="Add Payment"
                                                onClick={() => handleAddPayment(inv)}
                                            >
                                                <HiCurrencyRupee className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2 hover:bg-white hover:shadow-md rounded-lg text-red-500 transition-all"
                                                title="Delete"
                                                onClick={() => handleDelete(inv.invoice_id)}
                                            >
                                                <HiTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <HiDocumentText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">No invoices found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">Create your first invoice to get started.</p>
                        <Link to="/invoices/new"><Button icon={HiPlus}>Create Invoice</Button></Link>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    initialData={{
                        invoice_id: selectedInvoice.invoice_id,
                        dealer_id: selectedInvoice.dealer_id,
                        payment_type: selectedInvoice.invoice_type === 'Sales' ? 'IN' : 'OUT',
                        amount: selectedInvoice.balance_due > 0 ? selectedInvoice.balance_due : '',
                        related_to: 'INVOICE',
                        notes: `Payment for Invoice #${selectedInvoice.invoice_number}`
                    }}
                />
            )}
        </div>
    )
}
