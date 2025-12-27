"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Episode } from "@/lib/api";
import {
    Play, Pause, Heart, Share2, X, Lock,
    ChevronRight, Star
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

// --- SUB-COMPONENT: Single Video Instance ---
// Isolates refs and HLS state to prevent collisions during animations
interface VideoPlayerProps {
    src: string;
    poster?: string;
    isLocked: boolean;
    onEnded?: () => void;
    className?: string;
    isMobile?: boolean; // Controls overlay style
}

function VideoPlayer({ src, poster, isLocked, onEnded, className, isMobile }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // Seek Bar State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // HLS & Video Logic
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;
        let isMounted = true;

        // Reset states on mount (new src)
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        const handleWaiting = () => { if (isMounted) setIsLoading(true); };
        const handleCanPlay = () => { if (isMounted) setIsLoading(false); };
        const handlePlaying = () => {
            if (isMounted) {
                setIsLoading(false);
                setIsPlaying(true);
            }
        };
        const handlePause = () => { if (isMounted) setIsPlaying(false); };

        const handleTimeUpdate = () => {
            if (isMounted && video && !isDragging) {
                setCurrentTime(video.currentTime);
            }
        };
        const handleLoadedMetadata = () => {
            if (isMounted && video) {
                setDuration(video.duration);
            }
        };

        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("pause", handlePause);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);

        const initVideo = async () => {
            try {
                if (Hls.isSupported() && src && src.includes(".m3u8")) {
                    hls = new Hls({
                        debug: false,
                        enableWorker: true,
                        lowLatencyMode: true,
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(() => { });
                    });

                    hls.on(Hls.Events.FRAG_LOADED, () => {
                        // Sometimes duration isn't set until fragments load
                        if (video.duration && video.duration !== Infinity) {
                            setDuration(video.duration);
                        }
                    });

                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hls?.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hls?.recoverMediaError();
                                    break;
                                default:
                                    hls?.destroy();
                                    break;
                            }
                        }
                    });

                } else if (video && video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                    video.addEventListener("loadedmetadata", () => {
                        video.play().catch(() => { });
                    }, { once: true });
                } else if (video) {
                    video.src = src;
                    video.load();
                    video.play().catch(() => { });
                }
            } catch (e) {
                console.error("Video Init Error", e);
            }
        };

        if (src) initVideo();

        return () => {
            isMounted = false;
            if (video) {
                video.removeEventListener("waiting", handleWaiting);
                video.removeEventListener("canplay", handleCanPlay);
                video.removeEventListener("playing", handlePlaying);
                video.removeEventListener("pause", handlePause);
                video.removeEventListener("timeupdate", handleTimeUpdate);
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            }
            if (hls) hls.destroy();
        };
    }, [src]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) videoRef.current.play().catch(() => { });
        else videoRef.current.pause();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    // Format helper
    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "00:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="relative w-full h-full group" onClick={togglePlay}>
            {/* Video Element */}
            <video
                ref={videoRef}
                className={cn("w-full h-full object-contain bg-black", isLocked && "blur-sm opacity-50", className)}
                poster={poster}
                playsInline
                controls={!isMobile && !isLocked} // Native controls on Desktop only
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onEnded={onEnded}
            />

            {/* Custom Overlay (Mobile & Desktop Loading) */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                {/* Pointer events none allows click through to video/div for toggle */}

                {isLoading && (
                    <div className="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin" />
                )}

                {/* Mobile Play Button - Explicit Feedback */}
                {isMobile && !isLoading && !isPlaying && !isLocked && (
                    <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                        <Play size={32} className="text-white ml-1" fill="currentColor" />
                    </div>
                )}
            </div>

            {/* Mobile Seek Bar */}
            {isMobile && !isLocked && (
                <div
                    className="absolute bottom-32 left-0 w-full z-30 px-4 py-2 flex items-center gap-3 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()} // Prevent play toggle
                >
                    <span className="text-[10px] font-medium text-white/90 drop-shadow-md w-8 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 relative h-6 flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            onMouseDown={() => setIsDragging(true)}
                            onMouseUp={() => setIsDragging(false)}
                            className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
                        />
                        {/* Custom Track */}
                        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                        </div>
                        {/* Custom Thumb (Pseudo) */}
                        <div
                            className="absolute h-3 w-3 bg-white rounded-full shadow-md pointer-events-none"
                            style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-white/50 drop-shadow-md w-8">
                        {formatTime(duration)}
                    </span>
                </div>
            )}

            {/* Lock Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/40 pointer-events-auto">
                    {/* Lock UI content... reusing simplified version for reuse */}
                    <div className="bg-black/80 backdrop-blur-md p-6 border border-white/10 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <Lock className="w-8 h-8 text-white mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                        <button onClick={() => signIn("google")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 mt-4 transition flex items-center justify-center gap-2">
                            <span>Login to Watch</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// --- MAIN COMPONENT ---

const variants = {
    enter: (direction: number) => ({
        y: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        zIndex: 0
    }),
    center: {
        y: 0,
        opacity: 1,
        zIndex: 1
    },
    exit: (direction: number) => ({
        y: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        zIndex: 0
    })
};

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
    const { data: session } = useSession();

    // Episodes
    const episodes = [...initialEpisodes].sort((a, b) => a.chapterIndex - b.chapterIndex);
    const [currentEpisode, setCurrentEpisode] = useState<Episode>(episodes[0]);

    // Pagination
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE);
    const currentEpisodesList = episodes.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    // Mobile Drawer
    const [showMobileEpisodes, setShowMobileEpisodes] = useState(false);
    const toggleMobileEpisodes = () => setShowMobileEpisodes(!showMobileEpisodes);

    // Social & Swipe
    const [isLiked, setIsLiked] = useState(false);
    const minSwipeDistance = 50;
    const [direction, setDirection] = useState(0);

    // Lock Logic
    const isEpisodeLocked = (index: number) => false;
    const isLocked = false;

    useEffect(() => { setMounted(true); }, []);

    // Helper: Select Video Source
    const getVideoSrc = (ep: Episode) => {
        if (!ep) return "";
        const v720 = ep.cdnList[0]?.videoPathList.find((v) => v.quality === 720);
        return v720?.videoPath || ep.cdnList[0]?.videoPathList[0]?.videoPath || "";
    };

    const handleEpisodeClick = (ep: Episode) => {
        setCurrentEpisode(ep);
    };

    const handleVideoEnded = () => {
        const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
            setCurrentEpisode(episodes[currentIndex + 1]);
        }
    };

    const handleSwipe = (isUpSwipe: boolean, isDownSwipe: boolean) => {
        if (isUpSwipe) {
            setDirection(1);
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                handleEpisodeClick(episodes[currentIndex + 1]);
            }
        }
        if (isDownSwipe) {
            setDirection(-1);
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex > 0) {
                handleEpisodeClick(episodes[currentIndex - 1]);
            }
        }
    };

    if (!mounted) return <div className="min-h-screen bg-black" />;

    return (
        <div className="text-gray-200 selection:bg-blue-500/30">
            {/* ================= DESKTOP LAYOUT ================= */}
            {!isMobile && (
                <div className="py-6 min-h-screen">
                    <div className="container mx-auto px-4 max-w-[1400px]">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                            <Link href="/" className="hover:text-blue-500 flex items-center gap-1">Home</Link>
                            <ChevronRight size={14} />
                            <Link href="/" className="hover:text-blue-500">Drama</Link>
                            <ChevronRight size={14} />
                            <span className="text-gray-300 font-medium truncate max-w-[200px]">{dramaTitle}</span>
                            <ChevronRight size={14} />
                            <span className="text-blue-500 font-medium">Episode {currentEpisode.chapterIndex + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Player Wrapper */}
                                <div className="relative w-full bg-black overflow-hidden shadow-2xl border border-gray-800 aspect-video group">
                                    <VideoPlayer
                                        src={getVideoSrc(currentEpisode)}
                                        poster={dramaCover}
                                        isLocked={isLocked}
                                        onEnded={handleVideoEnded}
                                        isMobile={false}
                                    />
                                </div>
                                {/* Info */}
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        {dramaTitle} – Episode {currentEpisode.chapterIndex + 1}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" fill="currentColor" /><span>4.8</span></div>
                                        <span>•</span><span>{episodes.length} Episodes</span><span>•</span><span className="text-blue-400">Ongoing</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Logic (List) - Unchanged */}
                            <div className="lg:col-span-1">
                                <div className="bg-[#1a1a1a] border border-gray-800 overflow-hidden sticky top-24">
                                    <div className="p-4 border-b border-gray-800 bg-[#222]">
                                        <h2 className="font-bold text-white text-lg">Episodes</h2>
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2 p-3 overflow-x-auto border-b border-gray-800 no-scrollbar">
                                            {Array.from({ length: totalPages }).map((_, idx) => (
                                                <button key={idx} onClick={() => setPage(idx)} className={cn("px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors", page === idx ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400")}>
                                                    {idx * ITEMS_PER_PAGE + 1} - {Math.min((idx + 1) * ITEMS_PER_PAGE, episodes.length)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="p-3 grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {currentEpisodesList.map((ep) => {
                                            const isActive = currentEpisode.chapterId === ep.chapterId;
                                            return (
                                                <button key={ep.chapterId} onClick={() => handleEpisodeClick(ep)} className={cn("aspect-square flex items-center justify-center text-xs font-medium transition-colors", isActive ? "bg-blue-600 text-white" : "bg-[#252525] text-gray-400")}>
                                                    {ep.chapterIndex + 1}
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

            {/* ================= MOBILE LAYOUT ================= */}
            {isMobile && (
                <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col select-none">
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full z-20 p-4 pt-safe flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                        <Link href="/" className="p-2 -ml-2 hover:bg-white/10 transition pointer-events-auto">
                            <ChevronRight size={28} className="rotate-180" />
                        </Link>
                        <h1 className="text-lg font-bold drop-shadow-md">Reels</h1>
                    </div>

                    <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.div
                                key={currentEpisode.chapterId}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 flex items-center justify-center"
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.y;
                                    if (swipe < -minSwipeDistance) handleSwipe(true, false);
                                    else if (swipe > minSwipeDistance) handleSwipe(false, true);
                                }}
                            >
                                <VideoPlayer
                                    src={getVideoSrc(currentEpisode)}
                                    poster={dramaCover}
                                    isLocked={isLocked}
                                    onEnded={handleVideoEnded}
                                    isMobile={true}
                                />
                            </motion.div>
                        </AnimatePresence>


                        {/* Footer Info */}
                        <div className="absolute bottom-0 left-0 w-full z-20 px-3 pb-6 pt-12 pb-safe bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
                            <div className="mb-3">
                                <h2 className="font-bold text-white text-base drop-shadow-sm mb-1">{dramaTitle}</h2>
                                <p className="text-[13px] text-gray-100 line-clamp-2 leading-snug drop-shadow-sm opacity-90">
                                    {currentEpisode.chapterName || `Episode ${currentEpisode.chapterIndex + 1}`}
                                </p>
                            </div>
                            <button onClick={toggleMobileEpisodes} className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white text-sm font-medium py-2.5 flex items-center justify-between px-3 transition-colors rounded-lg">
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
                            <div className="absolute bottom-0 left-0 w-full bg-[#121212] max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-white/10 rounded-t-2xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Episodes</h3>
                                    <button onClick={() => setShowMobileEpisodes(false)} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
                                </div>
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                    <div className="grid grid-cols-5 gap-3">
                                        {episodes.map((ep) => {
                                            const isActive = currentEpisode.chapterId === ep.chapterId;
                                            return (
                                                <button
                                                    key={ep.chapterId}
                                                    ref={isActive ? (el) => el?.scrollIntoView({ block: "center", behavior: "smooth" }) : null}
                                                    onClick={() => { handleEpisodeClick(ep); setShowMobileEpisodes(false); }}
                                                    className={cn("aspect-square flex items-center justify-center text-sm font-bold transition-all relative border rounded-lg", isActive ? "bg-blue-600 text-white border-blue-500 shadow-lg scale-105" : "bg-[#252525] text-gray-300 hover:bg-[#333] hover:text-white border-white/5")}
                                                >
                                                    {ep.chapterIndex + 1}
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
