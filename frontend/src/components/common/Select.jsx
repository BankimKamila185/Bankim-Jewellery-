/**
 * Select Component
 */

export default function Select({
    label,
    options = [],
    placeholder,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && <label className="label">{label}</label>}
            <select className="select" {...props}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}
