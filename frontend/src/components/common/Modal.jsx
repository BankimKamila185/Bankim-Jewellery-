/**
 * Modal Component
 */

import { useEffect } from 'react'
import { HiX } from 'react-icons/hi'

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col animate-zoom-in m-auto`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                    <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-gray-100)]"
                    >
                        <HiX className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
