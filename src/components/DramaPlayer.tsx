"use client";

import { useState, useRef, useEffect } from "react";
import { Episode } from "@/lib/api";
import { Play, Lock, ChevronRight, Home, Star, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { useSession, signIn } from "next-auth/react";

interface DramaPlayerProps {
    initialEpisodes: Episode[];
    bookId: string;
    dramaTitle?: string;
    dramaCover?: string;
}

export default function DramaPlayer({ initialEpisodes, bookId, dramaTitle, dramaCover }: DramaPlayerProps) {
    const { data: session } = useSession();

    // Sort episodes by index just in case
    const episodes = [...initialEpisodes].sort((a, b) => a.chapterIndex - b.chapterIndex);

    const [currentEpisode, setCurrentEpisode] = useState<Episode>(episodes[0]);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    // Auto-scroll to top of player when episode changes could be nice, but let's keep it simple
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => { });
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

    // Lock Logic: Locked if no session AND episode index >= 5
    // episode index is 0-based, so index 0,1,2,3,4 are the first 5 episodes.
    // index 5 is the 6th episode.
    const isEpisodeLocked = (index: number) => !session && index >= 5;
    const isLocked = isEpisodeLocked(currentEpisode.chapterIndex);

    // Mobile Episode Drawer State
    const [showMobileEpisodes, setShowMobileEpisodes] = useState(false);

    // Toggle Episode Drawer
    const toggleMobileEpisodes = () => setShowMobileEpisodes(!showMobileEpisodes);

    // Mock Social interactions
    const [isLiked, setIsLiked] = useState(false);

    // Touch Handling for Mobile Swipe (Reels Style)
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

    // Mouse Support for Desktop "Mobile View" Testing
    const onMouseDown = (e: React.MouseEvent) => {
        touchEnd.current = null;
        touchStart.current = e.clientY;
    };

    const onMouseMove = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        // Only track if we started a click
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

        // Reset
        touchStart.current = null;
        touchEnd.current = null;
    };

    const handleSwipe = (isUpSwipe: boolean, isDownSwipe: boolean) => {
        if (isUpSwipe) {
            // Next Episode (Swipe Up)
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                console.log("Swiping Up - Next Episode");
                // Check if next episode is locked? 
                // Actually standard Reels allow scrolling, but will show lock screen if locked.
                // Our current logic handles lock screen display automatically based on the episode, so just switch.
                handleEpisodeClick(episodes[currentIndex + 1]);
            }
        }

        if (isDownSwipe) {
            // Prev Episode (Swipe Down)
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex > 0) {
                console.log("Swiping Down - Prev Episode");
                handleEpisodeClick(episodes[currentIndex - 1]);
            }
        }
    };

    return (
        <div className="text-gray-200 selection:bg-blue-500/30">

            {/* ================= DESKTOP LAYOUT (Hidden on Mobile) ================= */}
            <div className="hidden md:block py-6">
                <div className="container mx-auto px-4 max-w-[1400px]">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link href="/" className="hover:text-blue-500 flex items-center gap-1">
                            Home
                        </Link>
                        <ChevronRight size={14} />
                        <Link href="/" className="hover:text-blue-500">
                            Drama
                        </Link>
                        <ChevronRight size={14} />
                        <span className="text-gray-300 font-medium truncate max-w-[200px] md:max-w-none">
                            {dramaTitle || "Unknown Drama"}
                        </span>
                        <ChevronRight size={14} />
                        <span className="text-blue-500 font-medium">Episode {currentEpisode.chapterIndex + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Player & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Player Wrapper */}
                            <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 aspect-video group">
                                <video
                                    ref={videoRef}
                                    controls={!isLocked}
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
                                        <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                                <Lock className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
                                            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                                Login untuk melanjutkan menonton Episode {currentEpisode.chapterIndex + 1} ke atas.
                                                <br /><span className="text-yellow-500 text-xs">Episode 1-5 GRATIS!</span>
                                            </p>
                                            <button
                                                onClick={() => signIn("google")}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                            >
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
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                        <span>4.8</span>
                                    </div>
                                    <span>•</span>
                                    <span>{episodes.length} Episodes</span>
                                    <span>•</span>
                                    <span className="text-blue-400">Ongoing</span>
                                </div>

                                <p className="text-gray-400 leading-relaxed text-sm md:text-base border-t border-gray-800 pt-4">
                                    {dramaTitle} Episode {currentEpisode.chapterIndex + 1}. Watch full episodes of {dramaTitle} online in high quality.
                                    New episodes are updated daily. Don't miss out on the latest twists and turns!
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Sidebar Episode List */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden sticky top-24">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-800 bg-[#222]">
                                    <h2 className="font-bold text-white text-lg">Episodes <span className="text-gray-500 text-sm font-normal">({episodes.length})</span></h2>
                                </div>

                                {/* Pagination/Tabs */}
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2 p-3 overflow-x-auto border-b border-gray-800 no-scrollbar">
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPage(idx)}
                                                className={cn(
                                                    "px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                                                    page === idx
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                                                )}
                                            >
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
                                            <button
                                                key={ep.chapterId}
                                                onClick={() => handleEpisodeClick(ep)}
                                                className={cn(
                                                    "aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors relative",
                                                    isActive
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-[#252525] text-gray-400 hover:bg-[#333] hover:text-white",
                                                    isLockedItem && "opacity-75"
                                                )}
                                            >
                                                {isLockedItem ? (
                                                    <Lock size={12} className="text-yellow-500" />
                                                ) : (
                                                    ep.chapterIndex + 1
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Footer hint */}
                                <div className="p-3 bg-blue-500/10 border-t border-blue-500/20 text-blue-400 text-xs text-center font-medium">
                                    {!session ? "Sign in to unlock all episodes" : "Premium Unlocked"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ================= MOBILE LAYOUT (Visible on Mobile) ================= */}
            {/* Full Screen Immersive Player Overlay (Reels Style) */}
            <div
                className="md:hidden fixed inset-0 z-[60] bg-black text-white flex flex-col touch-none select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full z-20 p-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
                        <ChevronRight size={28} className="rotate-180" /> {/* Back Icon using Rotated Chevron or ArrowLeft */}
                    </Link>
                    <h1 className="text-lg font-bold drop-shadow-md">Reels</h1>
                </div>

                {/* Main Video Area */}
                <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center">
                    <video
                        ref={videoRef}
                        className={cn("w-full h-full object-contain md:object-cover", isLocked && "blur-md opacity-30")} // Use contain for safe viewing, or cover for immersive if vertical
                        poster={dramaCover}
                        onEnded={handleVideoEnded}
                        playsInline
                        controls={false} // Custom controls or minimal controls interactions
                        onClick={() => {
                            if (videoRef.current?.paused) videoRef.current.play();
                            else videoRef.current?.pause();
                        }}
                    >
                        {!isLocked && <source src={getVideoSrc(currentEpisode)} type="video/mp4" />}
                    </video>

                    {/* Mobile Lock Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center">
                            <Lock size={48} className="text-white/50 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Episode Locked</h3>
                            <p className="text-sm text-gray-400 mb-6">Login to continue watching</p>
                            <button
                                onClick={() => signIn("google")}
                                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold active:scale-95 transition"
                            >
                                Login Now
                            </button>
                        </div>
                    )}

                    {/* Right Side Actions */}
                    <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-6">
                        {/* Like */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                className="p-3 bg-black/40 backdrop-blur-sm rounded-full active:scale-90 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28" height="28"
                                    viewBox="0 0 24 24"
                                    fill={isLiked ? "#ef4444" : "none"}
                                    stroke={isLiked ? "#ef4444" : "currentColor"}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                </svg>
                            </button>
                            <span className="text-xs font-medium drop-shadow-md">{isLiked ? "2.5k" : "2.4k"}</span>
                        </div>

                        {/* Share */}
                        <div className="flex flex-col items-center gap-1">
                            <button className="p-3 bg-black/40 backdrop-blur-sm rounded-full active:scale-90 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                            </button>
                            <span className="text-xs font-medium drop-shadow-md">Share</span>
                        </div>
                    </div>

                    {/* Bottom Info Area */}
                    <div className="absolute bottom-0 left-0 w-full z-20 px-3 pb-6 pt-12 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="mb-3">
                            <h2 className="font-bold text-white text-base drop-shadow-sm mb-1">
                                {dramaTitle || "Short Drama Series"}
                            </h2>
                            <p className="text-[13px] text-gray-100 line-clamp-2 leading-snug drop-shadow-sm opacity-90">
                                Episode {currentEpisode.chapterIndex + 1} - Watch this amazing drama moment! 🔥 Log in to watch full episodes. #dramabox #romance
                            </p>
                        </div>

                        <button
                            onClick={toggleMobileEpisodes}
                            className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-between px-3 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                Watch More Episodes ({episodes.length})
                            </span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Mobile Episodes Bottom Sheet (Drawer) */}
                {showMobileEpisodes && (
                    <div className="absolute inset-0 z-50">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileEpisodes(false)} />

                        {/* Drawer */}
                        <div className="absolute bottom-0 left-0 w-full bg-[#121212] rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-white/10">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Episodes</h3>
                                <button onClick={() => setShowMobileEpisodes(false)} className="p-1 text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-5 gap-3">
                                    {episodes.map((ep) => {
                                        const isActive = currentEpisode.chapterId === ep.chapterId;
                                        const isLockedItem = isEpisodeLocked(ep.chapterIndex);

                                        return (
                                            <button
                                                key={ep.chapterId}
                                                onClick={() => {
                                                    handleEpisodeClick(ep);
                                                    setShowMobileEpisodes(false);
                                                }}
                                                className={cn(
                                                    "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all relative border border-white/5",
                                                    isActive
                                                        ? "bg-blue-600 text-white border-blue-500"
                                                        : "bg-[#252525] text-gray-300 hover:bg-[#333] hover:text-white",
                                                    isLockedItem && "opacity-70"
                                                )}
                                            >
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
        </div>
    );
}
