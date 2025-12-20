import { Drama } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface DramaCardProps {
    drama: Drama;
    className?: string;
}

export default function DramaCard({ drama, className }: DramaCardProps) {
    return (
        <Link
            href={{
                pathname: '/play',
                query: {
                    bookId: drama.bookId,
                    title: drama.bookName,
                    cover: drama.coverWap,
                    source: drama.source || 'dramabox'
                }
            }}
            className={`block group relative aspect-[3/4] overflow-hidden bg-gray-900 cursor-pointer active:scale-95 transition-transform duration-200 ${className}`}
        >
            {/* Image with Zoom Effect */}
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                <Image
                    src={drama.coverWap || "https://placehold.co/300x400/1a1a1a/666666?text=No+Image"}
                    alt={drama.bookName || "Drama Cover"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    unoptimized={!drama.coverWap} // Unoptimized for placeholder
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 transition-all duration-300 group-hover:translate-y-[-10px]">
                {/* Play Button Overlay (Hidden by default, shows on hover) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-50 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                    <div className="flex h-16 w-16 items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl">
                        <Play fill="currentColor" className="ml-1 h-8 w-8" />
                    </div>
                </div>

                {/* Tags */}
                <div className="mb-2 flex flex-wrap gap-1">
                    {drama.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-md">
                    {drama.bookName}
                </h3>

                {/* Stats */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-300 opacity-0 transition-opacity delay-100 duration-300 group-hover:opacity-100">
                    <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" /> {drama.playCount || 'N/A'} Views
                    </span>
                    {drama.chapterCount && (
                        <span>{drama.chapterCount} Eps</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
