/**
 * POS Page - Point of Sales
 * Smart Invoice Creation
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    HiShoppingCart,
    HiUserAdd,
    HiSearch,
    HiTrash,
    HiCheck,
    HiPlus
} from 'react-icons/hi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import { invoicesApi, dealersApi, variantsApi } from '../services/api'

export default function POS() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    // Data
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([]) // Variants

    // Cart
    const [cart, setCart] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState('')

    // Search
    const [productSearch, setProductSearch] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                dealersApi.list({ dealer_type: 'SELL' }),
                variantsApi.list()
            ])
            setCustomers(cRes.dealers || [])
            setProducts(pRes.variants || [])
        } catch (e) {
            console.error(e)
        }
    }

    const addToCart = (variant) => {
        // Check if already in cart
        const existing = cart.find(item => item.variant_id === variant.variant_id)
        if (existing) {
            setCart(cart.map(item => item.variant_id === variant.variant_id ? { ...item, quantity: item.quantity + 1 } : item))
        } else {
            setCart([...cart, {
                variant_id: variant.variant_id,
                variant_code: variant.variant_code,
                name: variant.variant_code, // Use code as name for now
                quantity: 1,
                unit_price: 0, // Manual Price Entry for Smart ERP
                finish: variant.finish,
                image: variant.image_drive_link
            }])
        }
    }

    const updateCartItem = (index, field, value) => {
        const newCart = [...cart]
        newCart[index][field] = value
        setCart(newCart)
    }

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index))
    }

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price || 0)), 0)
    }

    const handleCheckout = async () => {
        if (!selectedCustomer) return alert('Select Customer')
        if (cart.length === 0) return alert('Cart is empty')

        // Validate prices
        if (cart.some(item => !item.unit_price || parseFloat(item.unit_price) <= 0)) {
            return alert('Please enter valid selling prices for all items.')
        }

        setLoading(true)
        try {
            const invoiceData = {
                dealer_id: selectedCustomer,
                invoice_type: 'Sales',
                invoice_date: new Date().toISOString().split('T')[0],
                sub_total: calculateTotal(),
                grand_total: calculateTotal(),
                items: cart.map(item => ({
                    product_id: item.variant_id, // Using variant_id as product_id
                    cost_type: 'Product', // or Variant
                    description: `${item.variant_code} (${item.finish})`,
                    quantity: item.quantity,
                    unit_price: parseFloat(item.unit_price)
                }))
            }

            await invoicesApi.create(invoiceData)
            navigate('/invoices')

        } catch (e) {
            console.error(e)
            alert('Checkout Failed')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.variant_code.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.finish?.toLowerCase().includes(productSearch.toLowerCase())
    )

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4 animate-enter">

            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-subtle)] flex gap-4">
                    <div className="relative flex-1">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Items..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                            <div
                                key={p.variant_id}
                                onClick={() => addToCart(p)}
                                className="border border-gray-100 rounded-xl p-3 hover:shadow-md cursor-pointer transition-all bg-white group"
                            >
                                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                    {p.image_drive_link ? (
                                        <img src={p.image_drive_link} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">IMAGE</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <HiPlus className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm">{p.variant_code}</h4>
                                <p className="text-xs text-gray-500">{p.finish}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Stk: {p.stock_qty}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart / Billing */}
            <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl border border-[var(--border-subtle)] flex flex-col h-full">
                <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50 rounded-t-2xl">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <HiShoppingCart /> Current Bill
                    </h2>
                </div>

                <div className="p-4 border-b border-[var(--border-subtle)]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Customer</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            value={selectedCustomer}
                            onChange={e => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => <option key={c.dealer_id} value={c.dealer_id}>{c.name}</option>)}
                        </select>
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                            <HiUserAdd />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <h4 className="font-bold text-sm">{item.variant_code}</h4>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600"><HiTrash /></button>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updateCartItem(idx, 'quantity', parseFloat(e.target.value))}
                                        className="w-12 p-1 text-xs border rounded text-center"
                                        placeholder="Qty"
                                    />
                                    <span className="text-xs text-gray-400">x</span>
                                    <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => updateCartItem(idx, 'unit_price', parseFloat(e.target.value))}
                                        className="flex-1 p-1 text-xs border rounded font-mono"
                                        placeholder="Price (₹)"
                                    />
                                </div>
                                <div className="text-right text-xs font-bold mt-1 text-gray-700">
                                    ₹{(item.quantity * (item.unit_price || 0)).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">Cart is empty</div>}
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-b-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-gray-400 text-sm">Grand Total</span>
                        <span className="text-3xl font-bold font-mono">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                    <Button fullWidth onClick={handleCheckout} disabled={loading}>
                        {loading ? 'Processing...' : 'Complete Sale'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
