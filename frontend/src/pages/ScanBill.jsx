/**
 * ScanBill Page - Premium Interface
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    HiCamera,
    HiPhotograph,
    HiRefresh,
    HiCheck,
    HiX,
    HiDocumentText,
    HiLightningBolt
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { ocrApi } from '../services/api'

export default function ScanBill() {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const [mode, setMode] = useState('select')
    const [imageData, setImageData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [extractedData, setExtractedData] = useState(null)
    const [stream, setStream] = useState(null)

    // Camera Logic (Reusing previous logic, just updated UI wrappings)
    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            setStream(s); if (videoRef.current) videoRef.current.srcObject = s; setMode('camera')
        } catch (err) { setError('Camera access denied.') }
    }
    const stopCamera = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) } }
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const v = videoRef.current; const c = canvasRef.current; c.width = v.videoWidth; c.height = v.videoHeight
            c.getContext('2d').drawImage(v, 0, 0)
            setImageData(c.toDataURL('image/jpeg', 0.8)); stopCamera(); setMode('preview')
        }
    }
    const handleFileUpload = (e) => {
        const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { setImageData(ev.target.result); setMode('preview') }; r.readAsDataURL(f) }
    }
    const processImage = async () => {
        if (!imageData) return
        try {
            setLoading(true); setError(null)
            const res = await ocrApi.scan(imageData.split(',')[1])
            setExtractedData(res); setMode('result')
        } catch (err) { setError(err.message || 'Processing failed') }
        finally { setLoading(false) }
    }
    const reset = () => { stopCamera(); setMode('select'); setImageData(null); setExtractedData(null); setError(null) }
    const createInvoice = () => navigate('/invoices', { state: { extractedData } })

    return (
        <div className="max-w-xl mx-auto animate-enter">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Scan Bill</h1>
                <p className="text-[var(--text-secondary)]">AI-powered Invoice Digitization</p>
            </div>

            {mode === 'select' && (
                <div className="card p-8 text-center space-y-8">
                    <div className="w-24 h-24 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                        <HiLightningBolt className="w-12 h-12" />
                    </div>

                    <div className="space-y-4">
                        <Button size="lg" icon={HiCamera} fullWidth onClick={startCamera} className="h-14 text-lg shadow-lg shadow-orange-200">
                            Launch Camera
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">or</span></div>
                        </div>
                        <Button variant="secondary" size="lg" icon={HiPhotograph} fullWidth onClick={() => fileInputRef.current?.click()} className="h-14">
                            Upload Image
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </div>
                </div>
            )}

            {mode === 'camera' && (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[3/4]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                        <button onClick={reset} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><HiX className="w-6 h-6" /></button>
                        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 p-1"><div className="w-full h-full bg-white rounded-full border-2 border-black" /></button>
                        <div className="w-12" />
                    </div>
                </div>
            )}

            {mode === 'preview' && imageData && (
                <div className="card p-4 space-y-4">
                    <img src={imageData} alt="Preview" className="w-full rounded-xl" />
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={reset} fullWidth>Retake</Button>
                        <Button onClick={processImage} loading={loading} fullWidth>Process Image</Button>
                    </div>
                </div>
            )}

            {mode === 'result' && extractedData && (
                <div className="card p-6 space-y-6">
                    <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-xl">
                        <HiCheck className="w-6 h-6" />
                        <span className="font-bold">Text Extracted Successfully</span>
                    </div>

                    <div className="space-y-4">
                        <Input label="Extracted Name" value={extractedData.dealer_name || ''} onChange={e => setExtractedData({ ...extractedData, dealer_name: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Date" value={extractedData.date || ''} onChange={e => setExtractedData({ ...extractedData, date: e.target.value })} />
                            <Input label="Total Amount" value={extractedData.total || ''} onChange={e => setExtractedData({ ...extractedData, total: e.target.value })} />
                        </div>

                        {extractedData.items?.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="text-xs font-bold text-gray-500 uppercase">Items Found</label>
                                <ul className="mt-2 space-y-2">
                                    {extractedData.items.map((it, i) => (
                                        <li key={i} className="text-sm flex justify-between">
                                            <span>{it.description}</span>
                                            <span className="font-bold">₹{it.amount}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={reset} fullWidth>Discard</Button>
                        <Button onClick={createInvoice} fullWidth>Create Invoice</Button>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
