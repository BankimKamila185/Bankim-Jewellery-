import { NavLink } from 'react-router-dom'
import {
    HiHome,
    HiCamera,
    HiDocumentText,
    HiCube,
    HiUserGroup
} from 'react-icons/hi'

const mobileNavItems = [
    { path: '/dashboard', icon: HiHome, label: 'Home' },
    { path: '/invoices', icon: HiDocumentText, label: 'Invoices' },
    { path: '/scan', icon: HiCamera, label: 'Scan' },
    { path: '/products', icon: HiCube, label: 'Products' },
    { path: '/dealers', icon: HiUserGroup, label: 'Dealers' },
]

export default function MobileNav() {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border-color)] z-40 px-2 pb-safe">
            <div className="flex items-center justify-around h-16">
                {mobileNavItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => `
              flex flex-col items-center gap-1 px-3 py-2 rounded-xl
              transition-all duration-200
              ${isActive
                                ? 'text-[var(--color-primary)]'
                                : 'text-[var(--text-muted)]'
                            }
              ${path === '/scan' ? 'relative' : ''}
            `}
                    >
                        {path === '/scan' ? (
                            <div className="absolute -top-5 w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <>
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
