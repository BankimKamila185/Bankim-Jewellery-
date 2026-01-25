/**
 * Button Component
 */

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    fullWidth = false,
    className = '',
    ...props
}) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        ghost: 'btn-ghost',
        outline: 'btn-outline',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-sm',
    }

    return (
        <button
            className={`btn ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : Icon ? (
                <Icon className="w-4 h-4" />
            ) : null}
            {children}
        </button>
    )
}
