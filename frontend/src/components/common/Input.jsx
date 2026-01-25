/**
 * Input Component
 */

export default function Input({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && <label className="label">{label}</label>}
            <div className={Icon ? 'relative' : ''}>
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                )}
                <input
                    className={`input ${Icon ? 'pl-10' : ''}`}
                    {...props}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    )
}
