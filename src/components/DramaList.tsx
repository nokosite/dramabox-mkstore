"use client";

import { Drama } from "@/lib/api";
import DramaCard from "./DramaCard";

interface DramaListProps {
    dramas: Drama[];
    title?: string;
}

export default function DramaList({ dramas, title = "For You" }: DramaListProps) {
    if (!dramas || dramas.length === 0) {
        return null;
    }

    return (
        <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {title}
                </h2>
                <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    View All
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {dramas.map((drama, index) => (
                    <div key={`${drama.bookId}-${index}`}>
                        <DramaCard drama={drama} priority={index === 0} />
                    </div>
                ))}
            </div>
        </section>
    );
}
