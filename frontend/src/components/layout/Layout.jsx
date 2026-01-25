import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] font-sans">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
                {/* Header */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    )
}
