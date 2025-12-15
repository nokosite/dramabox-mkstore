import Navbar from "@/components/Navbar";
import { ChevronRight } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#121212] flex flex-col">
            <div className="md:hidden">
                {/* ================= MOBILE SKELETON (Reels Style) ================= */}
                {/* Full screen, no navbar */}
                <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-pulse">
                    {/* Top Header Placeholder */}
                    <div className="absolute top-0 left-0 w-full p-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                    </div>

                    {/* Center Loading Spinner/Icon */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-white/10 border-t-blue-600 rounded-full animate-spin" />
                    </div>

                    {/* Bottom Info Placeholder */}
                    <div className="absolute bottom-0 left-0 w-full p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent z-10 space-y-4">
                        {/* Title & Badge */}
                        <div className="space-y-2">
                            <div className="h-5 w-3/4 bg-white/10 rounded" />
                            <div className="h-4 w-1/2 bg-white/10 rounded" />
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <div className="h-3 w-full bg-white/10 rounded" />
                            <div className="h-3 w-5/6 bg-white/10 rounded" />
                        </div>

                        {/* Button */}
                        <div className="h-12 w-full bg-white/10 rounded-lg mt-2" />
                    </div>

                    {/* Right Side Action Placeholders */}
                    <div className="absolute right-4 bottom-32 z-10 flex flex-col gap-6 items-center">
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="hidden md:block">
                {/* ================= DESKTOP SKELETON ================= */}
                <Navbar />
                <div className="container mx-auto px-4 max-w-[1400px] py-6 animate-pulse">
                    {/* Skeleton Breadcrumbs */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-4 w-12 bg-gray-800 rounded" />
                        <ChevronRight size={14} className="text-gray-700" />
                        <div className="h-4 w-16 bg-gray-800 rounded" />
                        <ChevronRight size={14} className="text-gray-700" />
                        <div className="h-4 w-48 bg-gray-800 rounded" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Video Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Player */}
                            <div className="w-full aspect-video bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full" />
                            </div>
                            {/* Title */}
                            <div className="space-y-3">
                                <div className="h-8 w-3/4 bg-gray-900 rounded" />
                                <div className="h-4 w-1/4 bg-gray-900 rounded" />
                                <div className="h-20 w-full bg-gray-900 rounded mt-4" />
                            </div>
                        </div>

                        {/* Right: Sidebar Skeleton */}
                        <div className="lg:col-span-1 hidden lg:block">
                            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 h-[600px] p-4 space-y-4">
                                <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                                    {Array.from({ length: 48 }).map((_, i) => (
                                        <div key={i} className="aspect-square bg-gray-800 rounded" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
