// src/components/ui/ProductSkeleton.tsx

'use client';

interface ProductSkeletonProps {
    isListView?: boolean;
}

export default function ProductSkeleton({ isListView = false }: ProductSkeletonProps) {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isListView ? 'flex' : ''}`}>
            {/* Imagen skeleton */}
            <div className={`relative ${isListView ? 'w-32 sm:w-48 flex-shrink-0' : ''}`}>
                <div className={`w-full bg-gray-200 animate-pulse ${isListView ? 'h-full min-h-[160px]' : 'h-48 sm:h-64'}`} />
            </div>

            {/* Contenido skeleton */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Título */}
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-3" />

                {/* Descripción */}
                <div className="space-y-2 mb-3">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Talles */}
                <div className="flex space-x-1 mb-3">
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Precio y botones */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="mb-3">
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-10 bg-gray-300 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente para múltiples skeletons
export function ProductSkeletonGrid({ count = 6, isListView = false }: { count?: number; isListView?: boolean }) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <ProductSkeleton key={index} isListView={isListView} />
            ))}
        </>
    );
}
