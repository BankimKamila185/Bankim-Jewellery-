import { useLocation } from 'react-router-dom'
import { HiMenu, HiSearch, HiBell, HiMoon } from 'react-icons/hi'

const pageTitles = {
    '/dashboard': 'Overview',
    '/scan': 'Scan Bill',
    '/invoices': 'Invoices',
    '/products': 'Products',
    '/designers': 'Karigars',
    '/dealers': 'Dealers',
    '/reports': 'Reports',
    '/settings': 'Settings',
}

export default function Header({ onMenuClick }) {
    const location = useLocation()
    let title = pageTitles[location.pathname]

    // Handle dynamic routes approx
    if (!title) {
        if (location.pathname.includes('/new')) title = "Create New"
        else title = "Dashboard"
    }

    return (
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-[var(--border-subtle)]">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-body)]"
                >
                    <HiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
            </div>

            {/* Center - Search (Desktop) */}
            <div className="hidden md:block flex-1 max-w-lg mx-12">
                <div className="relative group">
                    <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--bg-body)] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary-light)] focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                <button className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-body)] hover:text-[var(--text-primary)] transition-colors relative">
                    <HiBell className="w-6 h-6" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-[1px] bg-[var(--border-medium)] mx-1"></div>

                <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-[var(--text-primary)]">Bankim Kamila</p>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Administrator</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shadow-md">
                        BK
                    </div>
                </div>
            </div>
        </header>
    )
}
