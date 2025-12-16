"use client";

import { Drama } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface FeaturedSectionProps {
    dramas: Drama[];
}

export default function FeaturedSection({ dramas }: FeaturedSectionProps) {
    if (!dramas || dramas.length === 0) return null;

    // Main Highlight (First item)
    const mainDrama = dramas[0];
    // Side Highlights (Next 2 items)
    const sideDramas = dramas.slice(1, 3);

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Main Highlight (Large) */}
                <div className="lg:col-span-2 relative bg-[#1a1a1a] rounded-xl overflow-hidden group">
                    <Link
                        href={{
                            pathname: '/play',
                            query: {
                                bookId: mainDrama.bookId,
                                title: mainDrama.bookName,
                                cover: mainDrama.coverWap
                            }
                        }}
                        className="flex flex-col md:flex-row h-full"
                    >
                        {/* Poster Image */}
                        <div className="relative w-full md:w-[45%] aspect-[3/4] md:aspect-auto">
                            <Image
                                src={mainDrama.coverWap || "https://placehold.co/400x600"}
                                alt={mainDrama.bookName}
                                fill
                                priority={true}
                                sizes="(max-width: 768px) 100vw, 66vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                unoptimized={!mainDrama.coverWap}
                            />
                            {/* Mobile Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden" />
                        </div>

                        {/* Specs / Text */}
                        <div className="p-6 flex flex-col justify-center flex-1 bg-[#1a1a1a] relative z-10">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight line-clamp-2">
                                {mainDrama.bookName}
                            </h2>
                            <div className="text-gray-400 text-sm mb-4">
                                {mainDrama.chapterCount ? `${mainDrama.chapterCount} Episode` : "Ongoing"}
                            </div>

                            <p className="text-gray-400 text-sm md:text-base line-clamp-4 md:line-clamp-5 mb-6 leading-relaxed">
                                {mainDrama.introduction || "No synopsis available for this drama. Watch directly to find out exactly what happened!"}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {mainDrama.tags?.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <button className="self-start flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition active:scale-95">
                                <Play fill="currentColor" size={18} /> Putar Sekarang
                            </button>
                        </div>
                    </Link>
                </div>

                {/* Right: Side Highlights (List) */}
                <div className="flex flex-col gap-6">
                    {sideDramas.map((drama) => (
                        <Link
                            key={drama.bookId}
                            href={{
                                pathname: '/play',
                                query: { bookId: drama.bookId, title: drama.bookName, cover: drama.coverWap }
                            }}
                            className="flex-1 relative bg-[#1a1a1a] rounded-xl overflow-hidden group flex"
                        >
                            {/* Image */}
                            <div className="relative w-2/5 aspect-[3/4]">
                                <Image
                                    src={drama.coverWap || "https://placehold.co/300x400"}
                                    alt={drama.bookName}
                                    fill
                                    sizes="(max-width: 768px) 33vw, 15vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    unoptimized={!drama.coverWap}
                                />
                            </div>
                            {/* Details */}
                            <div className="p-4 flex flex-col justify-center flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-blue-500 transition">
                                    {drama.bookName}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">
                                    {drama.chapterCount ? `${drama.chapterCount} Episode` : "Ongoing"}
                                </p>
                                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                    {drama.introduction || "Click to watch full drama now."}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Banner */}
            <div className="mt-8 rounded-xl bg-blue-50/5 border border-blue-500/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gray-800 rounded overflow-hidden relative hidden sm:block">
                        <div className="absolute inset-0 bg-blue-900/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-200">APP</span>
                        </div>
                    </div>
                    <p className="text-blue-200 font-medium text-sm md:text-base">
                        Langganan push drama populer, Jangan lewatkan drama baru apa pun.
                    </p>
                </div>
                <button className="px-6 py-2 bg-white text-blue-600 text-sm font-bold rounded-full hover:bg-gray-100 transition">
                    Ikuti
                </button>
            </div>
        </section>
    );
}
