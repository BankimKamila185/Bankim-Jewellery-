import { Link, useLocation } from 'react-router-dom'
import {
    HiHome,
    HiCube,
    HiColorSwatch,
    HiUserGroup,
    HiCog,
    HiFire,
    HiClipboardList,
    HiShoppingCart,
    HiDocumentText,
    HiUser,
    HiChartPie
} from 'react-icons/hi'

// Menu Groups
const menuGroups = [
    {
        title: 'Overview',
        items: [
            { path: '/dashboard', icon: HiHome, label: 'Command Center' },
        ]
    },
    {
        title: 'Production',
        items: [
            { path: '/workflow', icon: HiClipboardList, label: 'Workflow (Kanban)' },
            { path: '/plating', icon: HiFire, label: 'Plating Jobs' },
            { path: '/materials', icon: HiCube, label: 'Raw Stock' },
        ]
    },
    {
        title: 'Trading & Sales',
        items: [
            { path: '/invoices/new', icon: HiShoppingCart, label: 'POS / New Sale' },
            { path: '/invoices', icon: HiDocumentText, label: 'Invoice History' },
            { path: '/dealers', icon: HiUserGroup, label: 'Contacts (CRM)' },
        ]
    },
    {
        title: 'Masters',
        items: [
            { path: '/designs', icon: HiColorSwatch, label: 'Design Catalog' },
            { path: '/designers', icon: HiUser, label: 'Designers' },
            { path: '/reports', icon: HiChartPie, label: 'Reports' },
            { path: '/settings', icon: HiCog, label: 'Settings' },
        ]
    }
]

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation()

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-[var(--border-subtle)] transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                            B
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-[var(--text-primary)]">Bankim</h1>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Jewellery ERP</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-4rem)]">
                    {menuGroups.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group.title}</h3>
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = location.pathname === item.path

                                    return (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                onClick={() => window.innerWidth < 1024 && onClose()}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                        ? 'bg-[var(--color-primary)] text-white shadow-md shadow-indigo-200'
                                                        : 'text-[var(--text-secondary)] hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                                {item.label}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    )
}
