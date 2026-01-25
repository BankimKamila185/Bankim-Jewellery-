import { Link } from 'react-router-dom'

export default function DesignCard({ design }) {
    return (
        <Link to={`/designs/${design.design_id}`} className="block">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
                <div className="aspect-[4/3] bg-gray-50 relative">
                    {design.image_drive_link ? (
                        <img
                            src={design.image_drive_link}
                            alt={design.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <span className="text-4xl">💎</span>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full shadow-sm text-gray-600">
                            {design.category}
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{design.design_id}</p>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Base Cost</span>
                        <span className="font-medium text-gray-900">₹{design.base_design_cost?.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
