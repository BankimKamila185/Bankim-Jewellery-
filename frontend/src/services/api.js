/**
 * API Service - Axios instance configured for backend communication.
 */

import axios from 'axios'

// Create axios instance with base configuration
// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
            config.params = { ...config.params, _t: Date.now() }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.detail || error.message || 'An error occurred'
        console.error('API Error:', message)
        return Promise.reject(new Error(message))
    }
)

// ============ Dealers API ============

export const dealersApi = {
    list: (params = {}) => api.get('/dealers', { params }),
    get: (id) => api.get(`/dealers/${id}`),
    create: (data) => api.post('/dealers', data),
    update: (id, data) => api.put(`/dealers/${id}`, data),
    delete: (id) => api.delete(`/dealers/${id}`),
    generateCode: (dealer_type, category) =>
        api.get('/dealers/code/generate', { params: { dealer_type, category } }),
    getByType: (type) => api.get(`/dealers/type/${type}`),
}

// ============ Designers API ============

export const designersApi = {
    list: (params = {}) => api.get('/designers', { params }),
    get: (id) => api.get(`/designers/${id}`),
    create: (data) => api.post('/designers', data),
    update: (id, data) => api.put(`/designers/${id}`, data),
    delete: (id) => api.delete(`/designers/${id}`),
}

// ============ Materials API ============

export const materialsApi = {
    list: (params = {}) => api.get('/materials', { params }),
    get: (id) => api.get(`/materials/${id}`),
    create: (data) => api.post('/materials', data),
    update: (id, data) => api.put(`/materials/${id}`, data),
    delete: (id) => api.delete(`/materials/${id}`),
}

// ============ Invoices API ============

export const invoicesApi = {
    list: (params = {}) => api.get('/invoices', { params }),
    get: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    update: (id, data) => api.put(`/invoices/${id}`, data),
    delete: (id) => api.delete(`/invoices/${id}`),
    recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
    getByType: (type) => api.get(`/invoices/type/${type}`),
}

// ============ OCR API ============

export const ocrApi = {
    scan: (imageBase64) => api.post('/ocr/scan', { image_base64: imageBase64 }),
    scanFile: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/ocr/scan/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    upload: (invoiceId, file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('invoice_id', invoiceId)
        return api.post('/ocr/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    status: () => api.get('/ocr/status'),
}

// ============ Reports API ============

export const reportsApi = {
    sales: (params = {}) => api.get('/reports/sales', { params }),
    purchases: (params = {}) => api.get('/reports/purchases', { params }),
    profit: (params = {}) => api.get('/reports/profit', { params }),
    dealerBalance: () => api.get('/reports/dealer-balance'),
    lowStock: () => api.get('/reports/low-stock'),
}

// ============ Designs API ============

export const designsApi = {
    list: (params = {}) => api.get('/designs', { params }),
    get: (id) => api.get(`/designs/${id}`),
    create: (data) => api.post('/designs', data),
    update: (id, data) => api.put(`/designs/${id}`, data),
    delete: (id) => api.delete(`/designs/${id}`),
    getVariants: (id) => api.get(`/designs/${id}/variants`),
}

// ============ Variants API ============

export const variantsApi = {
    list: (params = {}) => api.get('/variants', { params }),
    get: (id) => api.get(`/variants/${id}`),
    create: (data) => api.post('/variants', data),
    update: (id, data) => api.put(`/variants/${id}`, data),
    delete: (id) => api.delete(`/variants/${id}`),
    uploadImage: (id, file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post(`/variants/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
}

// ============ Progress API ============

export const progressApi = {
    getStages: () => api.get('/progress/stages'),
    startProcess: (data) => api.post('/progress/start', data),
    completeStage: (progressId, data) => api.post(`/progress/complete/${progressId}`, data),
    getVariantHistory: (variantId) => api.get(`/progress/variant/${variantId}`),
    getCurrentStage: (variantId) => api.get(`/progress/current/${variantId}`),
}

// ============ Settings API ============

export const settingsApi = {
    get: () => api.get('/settings'),
    update: (settings) => api.put('/settings', settings),
    updateOne: (key, value, category = 'General') =>
        api.put(`/settings/${key}`, { value, category }),
}

// ============ Payments API ============

export const paymentsApi = {
    create: (data) => api.post('/payments', data),
    getByInvoice: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
    getByDealer: (dealerId) => api.get(`/payments/dealer/${dealerId}`),
    getByProgress: (progressId) => api.get(`/payments/progress/${progressId}`),
}

// ============ Plating API ============

export const platingApi = {
    getVendors: () => api.get('/plating/vendors'),
    getRates: () => api.get('/plating/rates'),
    createRate: (data) => api.post('/plating/rates', data),
    getJobs: (dealerId) => api.get('/plating/jobs', { params: { dealer_id: dealerId } }),
    assignJob: (data) => api.post('/plating/assign', data),
    completeJob: (jobId) => api.post(`/plating/complete/${jobId}`),
}

export default api
