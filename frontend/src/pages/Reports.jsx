/**
 * Reports Page - Premium Analytics
 */

import { useState, useEffect } from 'react'
import {
    HiChartBar,
    HiTrendingUp,
    HiTrendingDown,
    HiCurrencyRupee,
    HiCalendar,
    HiDownload
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { reportsApi } from '../services/api'

// Helper
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount || 0)
}

export default function Reports() {
    const [loading, setLoading] = useState(true)
    const [activeReport, setActiveReport] = useState('sales')
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    })
    const [data, setData] = useState(null)

    useEffect(() => { loadReport() }, [activeReport, dateRange])

    const loadReport = async () => {
        try {
            setLoading(true)
            let res
            const range = { date_from: dateRange.from, date_to: dateRange.to }

            switch (activeReport) {
                case 'sales': res = await reportsApi.sales(range); break
                case 'purchases': res = await reportsApi.purchases(range); break
                case 'profit': res = await reportsApi.profit(range); break
                case 'dealer-balance': res = await reportsApi.dealerBalance(); break
                case 'low-stock': res = await reportsApi.lowStock(); break
                default: res = {}
            }
            setData(res)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'sales', label: 'Sales Performance' },
        { id: 'purchases', label: 'Purchase Analysis' },
        { id: 'profit', label: 'Profit & Loss' },
        { id: 'dealer-balance', label: 'Outstanding Balance' },
        { id: 'low-stock', label: 'Inventory Alerts' },
    ]

    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
                    <p className="text-[var(--text-secondary)]">Insights and performance metrics</p>
                </div>
                <div className="flex gap-3 bg-[var(--bg-body)] p-2 rounded-xl">
                    <div className="flex items-center gap-2 px-3">
                        <span className="text-xs text-[var(--text-muted)] font-bold uppercase">Date Range</span>
                    </div>
                    <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="bg-white border-none rounded-lg text-sm px-2 py-1 outline-none shadow-sm" />
                    <span className="text-gray-400 self-center">-</span>
                    <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="bg-white border-none rounded-lg text-sm px-2 py-1 outline-none shadow-sm" />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeReport === tab.id ? 'bg-[var(--text-primary)] text-white shadow-lg' : 'bg-white text-[var(--text-secondary)] hover:bg-gray-50 border border-[var(--border-subtle)]'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {loading ? (
                    <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)]">
                        <div className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-[var(--text-secondary)]">Crunching numbers...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* Dynamic Report Views */}
                        {activeReport === 'sales' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
                                    <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
                                    <h3 className="text-3xl font-bold">{formatMoney(data.total_sales)}</h3>
                                </div>
                                <div className="card p-6">
                                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Invoices Generated</p>
                                    <h3 className="text-3xl font-bold text-[var(--text-primary)]">{data.total_invoices}</h3>
                                </div>
                                <div className="card p-6">
                                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Items Sold</p>
                                    <h3 className="text-3xl font-bold text-[var(--text-primary)]">{data.total_items_sold}</h3>
                                </div>
                                <div className="card p-6">
                                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Avg. Transaction</p>
                                    <h3 className="text-3xl font-bold text-[var(--text-primary)]">{formatMoney(data.average_invoice_value)}</h3>
                                </div>

                                {/* Top Products Table */}
                                <div className="lg:col-span-4 card p-6">
                                    <h3 className="font-bold text-lg mb-4">Top Selling Products</h3>
                                    {data.top_products?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-3 rounded-l-lg text-xs font-bold text-gray-500 uppercase">Product ID</th>
                                                        <th className="p-3 rounded-r-lg text-xs font-bold text-gray-500 uppercase text-right">Total Sales</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.top_products.map((p, i) => (
                                                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                            <td className="p-3 font-medium">{p.product_id}</td>
                                                            <td className="p-3 text-right font-bold text-green-600">{formatMoney(p.total_sales)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className="text-gray-400 text-center py-4">No sales data recorded yet.</p>}
                                </div>
                            </div>
                        )}

                        {activeReport === 'profit' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="card p-6">
                                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Total Revenue</p>
                                    <h3 className="text-3xl font-bold text-green-600">{formatMoney(data.total_revenue)}</h3>
                                </div>
                                <div className="card p-6">
                                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Total Cost</p>
                                    <h3 className="text-3xl font-bold text-red-500">{formatMoney(data.total_cost)}</h3>
                                </div>
                                <div className="card p-6 bg-[var(--text-primary)] text-white border-none">
                                    <p className="text-gray-400 text-sm font-medium mb-1">Net Profit</p>
                                    <h3 className="text-3xl font-bold">{formatMoney(data.gross_profit)}</h3>
                                    <div className="mt-2 inline-block px-2 py-1 bg-white/20 rounded text-xs">Margin: {data.profit_margin?.toFixed(2)}%</div>
                                </div>
                            </div>
                        )}

                        {/* Add other report views as needed, sticking to the design pattern */}
                        {(activeReport === 'purchases' || activeReport === 'dealer-balance' || activeReport === 'low-stock') && (
                            <div className="card p-12 text-center">
                                <p className="text-lg font-medium">Detailed Report View</p>
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl max-w-md mx-auto text-left font-mono text-xs overflow-auto">
                                    {JSON.stringify(data, null, 2)}
                                </div>
                            </div>
                        )}

                    </>
                ) : null}
            </div>
        </div>
    )
}
