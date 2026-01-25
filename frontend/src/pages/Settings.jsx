/**
 * Settings Page - Premium Layout
 */

import { useState, useEffect } from 'react'
import {
    HiCheck,
    HiRefresh,
    HiOfficeBuilding,
    HiCurrencyRupee,
    HiDocumentText,
    HiServer
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { settingsApi } from '../services/api'

export default function Settings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({})

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            setLoading(true)
            const data = await settingsApi.get()
            setSettings(data.settings || {})
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await settingsApi.update(settings)
            alert("Settings saved!")
        } catch (e) { alert("Failed to save") }
        finally { setSaving(false) }
    }

    const update = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

    if (loading) return <div className="p-12 text-center">Loading...</div>

    return (
        <div className="space-y-6 animate-enter max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
                    <p className="text-[var(--text-secondary)]">System configuration</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" icon={HiRefresh} onClick={load}>Reset</Button>
                    <Button icon={HiCheck} onClick={handleSave} loading={saving}>Save Changes</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="card p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><HiOfficeBuilding className="w-6 h-6" /></div>
                        <h3 className="text-lg font-bold">Company Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Company Name" value={settings.company_name} onChange={e => update('company_name', e.target.value)} />
                        <Input label="GSTIN" value={settings.company_gstin} onChange={e => update('company_gstin', e.target.value)} />
                        <Input label="Email" value={settings.company_email} onChange={e => update('company_email', e.target.value)} />
                        <Input label="Phone" value={settings.company_phone} onChange={e => update('company_phone', e.target.value)} />
                        <div className="md:col-span-2">
                            <Input label="Address" value={settings.company_address} onChange={e => update('company_address', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><HiCurrencyRupee className="w-6 h-6" /></div>
                        <h3 className="text-lg font-bold">Financial Defaults</h3>
                    </div>
                    <div className="space-y-4">
                        <Input label="Default Tax (%)" type="number" value={settings.default_tax_percent} onChange={e => update('default_tax_percent', e.target.value)} />
                        <Input label="Currency Symbol" value={settings.currency_symbol} onChange={e => update('currency_symbol', e.target.value)} />
                        <Input label="Low Stock Warning Limit" type="number" value={settings.low_stock_threshold} onChange={e => update('low_stock_threshold', e.target.value)} />
                    </div>
                </div>

                {/* Invoice Prefixes */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><HiDocumentText className="w-6 h-6" /></div>
                        <h3 className="text-lg font-bold">Invoicing Prefixes</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['Material', 'Making', 'Finishing', 'Packing', 'Sales'].map(type => (
                            <Input
                                key={type}
                                label={type}
                                value={settings[`invoice_prefix_${type.toLowerCase()}`]}
                                onChange={e => update(`invoice_prefix_${type.toLowerCase()}`, e.target.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
