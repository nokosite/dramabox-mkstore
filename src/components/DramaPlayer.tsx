"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Episode } from "@/lib/api";
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
    ChevronLeft, FastForward, MessageSquare, Heart, Share2, AlertCircle, X, Lock,
    ChevronRight, Star, Home
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Custom hook to detect mobile screen
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
}

interface DramaPlayerProps {
    initialEpisodes: Episode[];
    bookId: string;
    dramaTitle?: string;
    dramaCover?: string;
}

export default function DramaPlayer({
    initialEpisodes,
    bookId,
    dramaTitle,
    dramaCover
}: DramaPlayerProps) {
    const [mounted, setMounted] = useState(false);
    const isMobile = useIsMobile();

    // We only use one ref now, as only one player will exist at a time
    const videoRef = useRef<HTMLVideoElement>(null);
    const { data: session } = useSession();

    // Sort episodes by index just in case
    const episodes = [...initialEpisodes].sort((a, b) => a.chapterIndex - b.chapterIndex);

    const [currentEpisode, setCurrentEpisode] = useState<Episode>(episodes[0]);

    // Filter/Pagination for episodes (Group by 50)
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE);
    const currentEpisodesList = episodes.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const handleEpisodeClick = (ep: Episode) => {
        setCurrentEpisode(ep);
    };

    // Auto-play next episode when ended
    const handleVideoEnded = () => {
        if (!session) return; // Don't auto-play if locked

        const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
            setCurrentEpisode(episodes[currentIndex + 1]);
        }
    };

    // Prevent Hydration Mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-play when episode changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch((e) => console.log("Auto-play blocked", e));
        }
    }, [currentEpisode]);

    const getVideoSrc = (ep: Episode) => {
        if (!ep) return "";
        // Priority: 720p -> first available
        const v720 = ep.cdnList[0]?.videoPathList.find((v) => v.quality === 720);
        return v720?.videoPath || ep.cdnList[0]?.videoPathList[0]?.videoPath || "";
    };

    // Calculate range string for pagination text
    const rangeStart = page * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min((page + 1) * ITEMS_PER_PAGE, episodes.length);

    // Lock Logic
    const isEpisodeLocked = (index: number) => !session && index >= 5;
    const isLocked = isEpisodeLocked(currentEpisode.chapterIndex);

    // Mobile Episode Drawer State
    const [showMobileEpisodes, setShowMobileEpisodes] = useState(false);
    const toggleMobileEpisodes = () => setShowMobileEpisodes(!showMobileEpisodes);

    // Mock Social interactions
    const [isLiked, setIsLiked] = useState(false);

    // Touch Handling (`useRef` is fine across renders)
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientY;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isUpSwipe = distance > minSwipeDistance;
        const isDownSwipe = distance < -minSwipeDistance;
        handleSwipe(isUpSwipe, isDownSwipe);
    };

    // Mouse Support
    const onMouseDown = (e: React.MouseEvent) => {
        touchEnd.current = null;
        touchStart.current = e.clientY;
    };

    const onMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        if (touchStart.current !== null) {
            touchEnd.current = e.clientY;
        }
    };

    const onMouseUp = () => {
        if (!touchStart.current || !touchEnd.current) {
            touchStart.current = null;
            return;
        }
        const distance = touchStart.current - touchEnd.current;
        const isUpSwipe = distance > minSwipeDistance;
        const isDownSwipe = distance < -minSwipeDistance;
        handleSwipe(isUpSwipe, isDownSwipe);
        touchStart.current = null;
        touchEnd.current = null;
    };

    const handleSwipe = (isUpSwipe: boolean, isDownSwipe: boolean) => {
        if (isUpSwipe) {
            // Next Episode (Swipe Up)
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                handleEpisodeClick(episodes[currentIndex + 1]);
            }
        }
        if (isDownSwipe) {
            // Prev Episode (Swipe Down)
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex > 0) {
                handleEpisodeClick(episodes[currentIndex - 1]);
            }
        }
    };

    if (!mounted) return <div className="min-h-screen bg-black" />; // Avoid hydration mismatch

    return (
        <div className="text-gray-200 selection:bg-blue-500/30">

            {/* ================= DESKTOP LAYOUT (Only Render if NOT Mobile) ================= */}
            {!isMobile && (
                <div className="py-6 min-h-screen">
                    <div className="container mx-auto px-4 max-w-[1400px]">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                            <Link href="/" className="hover:text-blue-500 flex items-center gap-1">Home</Link>
                            <ChevronRight size={14} />
                            <Link href="/" className="hover:text-blue-500">Drama</Link>
                            <ChevronRight size={14} />
                            <span className="text-gray-300 font-medium truncate max-w-[200px]">{dramaTitle || "Unknown Drama"}</span>
                            <ChevronRight size={14} />
                            <span className="text-blue-500 font-medium">Episode {currentEpisode.chapterIndex + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Player & Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Player Wrapper */}
                                <div className="relative w-full bg-black overflow-hidden shadow-2xl border border-gray-800 aspect-video group">
                                    <video
                                        ref={videoRef}
                                        controls={!isLocked}
                                        controlsList="nodownload"
                                        onContextMenu={(e) => e.preventDefault()}
                                        className={cn("w-full h-full object-contain", isLocked && "blur-sm opacity-50")}
                                        poster={dramaCover}
                                        onEnded={handleVideoEnded}
                                        playsInline
                                    >
                                        {!isLocked && <source src={getVideoSrc(currentEpisode)} type="video/mp4" />}
                                        Your browser does not support the video tag.
                                    </video>

                                    {/* Lock Overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/40">
                                            <div className="bg-black/80 backdrop-blur-md p-8 border border-white/10 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                                                <div className="w-16 h-16 bg-white/10 flex items-center justify-center mb-6 mx-auto">
                                                    <Lock className="w-8 h-8 text-white" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
                                                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                                    Login untuk melanjutkan menonton Episode {currentEpisode.chapterIndex + 1} ke atas.
                                                    <br /><span className="text-yellow-500 text-xs">Episode 1-5 GRATIS!</span>
                                                </p>
                                                <button onClick={() => signIn("google")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 transition flex items-center justify-center gap-2">
                                                    <Play size={18} fill="currentColor" />
                                                    <span>Login untuk Menonton</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Title & Stats */}
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        {dramaTitle || "Drama Title"} – Episode {currentEpisode.chapterIndex + 1}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" fill="currentColor" /><span>4.8</span></div>
                                        <span>•</span><span>{episodes.length} Episodes</span><span>•</span><span className="text-blue-400">Ongoing</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed text-sm md:text-base border-t border-gray-800 pt-4">
                                        {dramaTitle} Episode {currentEpisode.chapterIndex + 1}. Watch full episodes online.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Sidebar Episode List */}
                            <div className="lg:col-span-1">
                                <div className="bg-[#1a1a1a] border border-gray-800 overflow-hidden sticky top-24">
                                    <div className="p-4 border-b border-gray-800 bg-[#222]">
                                        <h2 className="font-bold text-white text-lg">Episodes <span className="text-gray-500 text-sm font-normal">({episodes.length})</span></h2>
                                    </div>
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2 p-3 overflow-x-auto border-b border-gray-800 no-scrollbar">
                                            {Array.from({ length: totalPages }).map((_, idx) => (
                                                <button key={idx} onClick={() => setPage(idx)} className={cn("px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors", page === idx ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white")}>
                                                    {idx * ITEMS_PER_PAGE + 1} - {Math.min((idx + 1) * ITEMS_PER_PAGE, episodes.length)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {/* Grid */}
                                    <div className="p-3 grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {currentEpisodesList.map((ep) => {
                                            const isActive = currentEpisode.chapterId === ep.chapterId;
                                            const isLockedItem = isEpisodeLocked(ep.chapterIndex);
                                            return (
                                                <button key={ep.chapterId} onClick={() => handleEpisodeClick(ep)} className={cn("aspect-square flex items-center justify-center text-xs font-medium transition-colors relative", isActive ? "bg-blue-600 text-white" : "bg-[#252525] text-gray-400 hover:bg-[#333] hover:text-white", isLockedItem && "opacity-75")}>
                                                    {isLockedItem ? <Lock size={12} className="text-yellow-500" /> : ep.chapterIndex + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* ================= MOBILE LAYOUT (Only Render if Mobile) ================= */}
            {isMobile && (
                <div
                    className="fixed inset-0 z-[60] bg-black text-white flex flex-col touch-none select-none"
                    onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                >
                    <div className="absolute top-0 left-0 w-full z-20 p-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent">
                        <Link href="/" className="p-2 -ml-2 hover:bg-white/10 transition">
                            <ChevronRight size={28} className="rotate-180" />
                        </Link>
                        <h1 className="text-lg font-bold drop-shadow-md">Reels</h1>
                    </div>

                    <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center">
                        <video
                            ref={videoRef}
                            className={cn("w-full h-full object-contain", isLocked && "blur-md opacity-30")}
                            poster={dramaCover}
                            onEnded={handleVideoEnded}
                            playsInline
                            controls={false}
                            controlsList="nodownload"
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={() => {
                                if (videoRef.current?.paused) videoRef.current.play();
                                else videoRef.current?.pause();
                            }}
                        >
                            {!isLocked && <source src={getVideoSrc(currentEpisode)} type="video/mp4" />}
                        </video>

                        {isLocked && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center">
                                <Lock size={48} className="text-white/50 mb-4" />
                                <h3 className="text-xl font-bold mb-2">Episode Locked</h3>
                                <p className="text-sm text-gray-400 mb-6">Login to continue watching</p>
                                <button onClick={() => signIn("google")} className="bg-blue-600 text-white px-8 py-3 font-bold active:scale-95 transition">
                                    Login Now
                                </button>
                            </div>
                        )}

                        <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-6">
                            <div className="flex flex-col items-center gap-1">
                                <button onClick={() => setIsLiked(!isLiked)} className="p-3 bg-black/40 backdrop-blur-sm active:scale-90 transition">
                                    <Heart size={28} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "currentColor"} />
                                </button>
                                <span className="text-xs font-medium drop-shadow-md">{isLiked ? "2.5k" : "2.4k"}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <button className="p-3 bg-black/40 backdrop-blur-sm active:scale-90 transition">
                                    <Share2 size={28} />
                                </button>
                                <span className="text-xs font-medium drop-shadow-md">Share</span>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full z-20 px-3 pb-6 pt-12 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="mb-3">
                                <h2 className="font-bold text-white text-base drop-shadow-sm mb-1">{dramaTitle || "Short Drama"}</h2>
                                <p className="text-[13px] text-gray-100 line-clamp-2 leading-snug drop-shadow-sm opacity-90">
                                    Episode {currentEpisode.chapterIndex + 1} - Watch this amazing drama moment!
                                </p>
                            </div>
                            <button onClick={toggleMobileEpisodes} className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white text-sm font-medium py-2.5 flex items-center justify-between px-3 transition-colors">
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    Watch More ({episodes.length})
                                </span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {showMobileEpisodes && (
                        <div className="absolute inset-0 z-50">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileEpisodes(false)} />
                            <div className="absolute bottom-0 left-0 w-full bg-[#121212] max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-white/10">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Episodes</h3>
                                    <button onClick={() => setShowMobileEpisodes(false)} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
                                </div>
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                    <div className="grid grid-cols-5 gap-3">
                                        {episodes.map((ep) => {
                                            const isActive = currentEpisode.chapterId === ep.chapterId;
                                            const isLockedItem = isEpisodeLocked(ep.chapterIndex);
                                            return (
                                                <button key={ep.chapterId} onClick={() => { handleEpisodeClick(ep); setShowMobileEpisodes(false); }} className={cn("aspect-square flex items-center justify-center text-sm font-bold transition-all relative border border-white/5", isActive ? "bg-blue-600 text-white border-blue-500" : "bg-[#252525] text-gray-300 hover:bg-[#333] hover:text-white", isLockedItem && "opacity-70")}>
                                                    {isLockedItem ? <Lock size={14} className="text-yellow-500" /> : ep.chapterIndex + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
