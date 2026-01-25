/**
 * Table Component
 */

export default function Table({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data found',
}) {
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="p-8 text-center text-[var(--text-muted)]">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i}>
                            {columns.map(col => (
                                <td key={col.key}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
