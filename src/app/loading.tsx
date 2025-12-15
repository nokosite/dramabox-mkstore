export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white animate-pulse">
            {/* Hero Skeleton */}
            <div className="h-[60vh] w-full bg-gray-900 mb-12 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full" />
            </div>

            {/* List Skeletons */}
            <div className="space-y-12 px-4 md:px-8 max-w-7xl mx-auto">
                {[1, 2, 3].map((section) => (
                    <div key={section}>
                        <div className="h-8 w-48 bg-gray-900 rounded mb-6" />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
