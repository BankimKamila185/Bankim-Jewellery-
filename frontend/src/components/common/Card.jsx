/**
 * Card Component
 */

export default function Card({
    children,
    title,
    subtitle,
    action,
    padding = 'normal',
    className = '',
    ...props
}) {
    const paddings = {
        none: 'p-0',
        sm: 'p-3',
        normal: 'p-5',
        lg: 'p-6',
    }

    return (
        <div
            className={`card ${paddings[padding]} ${className}`}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between mb-3">
                    <div>
                        {title && <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>}
                        {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    )
}
