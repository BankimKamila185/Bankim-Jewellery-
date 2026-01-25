import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ScanBill from './pages/ScanBill'
import Invoices from './pages/Invoices'
import POS from './pages/POS'
import Materials from './pages/Materials'
import Designers from './pages/Designers'
import Dealers from './pages/Dealers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

import DesignsPage from './pages/DesignsPage'
import DesignDetailsPage from './pages/DesignDetailsPage'
import VariantDetail from './pages/VariantDetail'
import Plating from './pages/Plating'
import Workflow from './pages/Workflow'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanBill />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<POS />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/designs" element={<DesignsPage />} />
          <Route path="/designs/:id" element={<DesignDetailsPage />} />
          <Route path="/variants/:variantId" element={<VariantDetail />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/plating" element={<Plating />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
