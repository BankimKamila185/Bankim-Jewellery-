/**
 * Badge Component
 */

export default function Badge({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const variants = {
        primary: 'badge-primary',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
    }

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
    }

    return (
        <span
            className={`badge ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </span>
    )
}
