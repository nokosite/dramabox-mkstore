"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Episode } from "@/lib/api";
import {
    Play, Pause, Heart, Share2, X, Lock,
    ChevronRight, Star, FastForward, Rewind
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

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
interface VideoPlayerProps {
    src: string;
    poster?: string;
    isLocked: boolean;
    onEnded?: () => void;
    className?: string;
    isMobile?: boolean; // Controls overlay style
    isActive: boolean; // Controls auto-play/pause for swiper
}

function VideoPlayer({ src, poster, isLocked, onEnded, className, isMobile, isActive }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // Seek Bar State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Double Tap State
    const [showDoubleTapOverlay, setShowDoubleTapOverlay] = useState<'left' | 'right' | null>(null);
    const lastTapTimeRef = useRef<number>(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const handleLoadedData = () => { if (isMounted) setIsLoading(false); };
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
        video.addEventListener("loadeddata", handleLoadedData);
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
                        if (isActive) video.play().catch(() => { });
                    });

                    hls.on(Hls.Events.FRAG_LOADED, () => {
                        if (video.duration && video.duration !== Infinity) {
                            setDuration(video.duration);
                        }
                    });

                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data.fatal) {
                            hls?.startLoad(); // Simple auto retry
                        }
                    });

                } else if (video) {
                    video.src = src;
                    video.load();
                    if (isActive) video.play().catch(() => { });
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
                video.removeEventListener("loadeddata", handleLoadedData);
                video.removeEventListener("playing", handlePlaying);
                video.removeEventListener("pause", handlePause);
                video.removeEventListener("timeupdate", handleTimeUpdate);
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            }
            if (hls) hls.destroy();
        };
    }, [src]); // Only re-run if src changes. isActive handled by separate effect.

    // Watch isActive to Play/Pause
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive && !isLocked) {
            video.play().catch(() => { });
        } else {
            video.pause();
        }
    }, [isActive, isLocked]);


    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) videoRef.current.play().catch(() => { });
        else videoRef.current.pause();
    };

    // Double Tap Handler
    const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, zone: 'left' | 'right') => {
        // We use click for this demo, keeping it simple.
        // Real implementation might need rigorous touch handling.

        const now = Date.now();
        const video = videoRef.current;
        if (!video) return;

        // If video is PAUSED, play immediately (Crucial for mobile policy)
        if (video.paused) {
            video.play().catch(() => { });
            return; // Do not check for double tap if we just started playing
        }

        if (now - lastTapTimeRef.current < 300) {
            // Double Tap Detected
            if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

            const skipAmount = 5;
            if (zone === 'left') {
                video.currentTime = Math.max(0, video.currentTime - skipAmount);
                setShowDoubleTapOverlay('left');
            } else {
                video.currentTime = Math.min(video.duration, video.currentTime + skipAmount);
                setShowDoubleTapOverlay('right');
            }

            // Hide overlay after animation
            setTimeout(() => setShowDoubleTapOverlay(null), 600);
        } else {
            // Single Tap
            lastTapTimeRef.current = now;
            tapTimeoutRef.current = setTimeout(() => {
                togglePlay();
            }, 300);
        }
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
        <div className="relative w-full h-full group bg-black">
            {/* Tap Zones Layer */}
            {isMobile && !isLocked && (
                <div className="absolute inset-0 z-20 flex pointer-events-auto">
                    <div
                        className="w-1/2 h-full z-20"
                        onClick={(e) => { e.preventDefault(); handleTap(e, 'left'); }}
                    />
                    <div
                        className="w-1/2 h-full z-20"
                        onClick={(e) => { e.preventDefault(); handleTap(e, 'right'); }}
                    />
                </div>
            )}

            {/* Double Tap Visual Feedback */}
            {showDoubleTapOverlay === 'left' && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center text-white/80 animate-in zoom-in fade-out duration-500">
                    <Rewind size={40} fill="currentColor" />
                    <span className="text-xs font-bold mt-1">-5s</span>
                </div>
            )}
            {showDoubleTapOverlay === 'right' && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center text-white/80 animate-in zoom-in fade-out duration-500">
                    <FastForward size={40} fill="currentColor" />
                    <span className="text-xs font-bold mt-1">+5s</span>
                </div>
            )}


            {/* Video Element */}
            <video
                ref={videoRef}
                className={cn("w-full h-full object-contain bg-black pointer-events-none", isLocked && "blur-sm opacity-50", className)} // pointer-events-none so clicks go to tap zones
                poster={poster}
                playsInline
                controls={!isMobile && !isLocked} // Native controls on Desktop only
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onEnded={onEnded}
            />

            {/* Custom Overlay (Mobile & Desktop Loading) */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
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
                    className="absolute bottom-0 left-0 w-full z-30 px-4 pb-safe pt-4 flex items-center gap-3 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent"
                    onClick={(e) => e.stopPropagation()}
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

    // Pagination (for sidebar)
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE);
    const currentEpisodesList = episodes.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    // Mobile Drawer
    const [showMobileEpisodes, setShowMobileEpisodes] = useState(false);
    const toggleMobileEpisodes = () => setShowMobileEpisodes(!showMobileEpisodes);

    // Swiper Ref
    const swiperRef = useRef<SwiperType | null>(null);

    // Lock Logic
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
        // Sync Swiper if on mobile
        if (isMobile && swiperRef.current) {
            const idx = episodes.findIndex(e => e.chapterId === ep.chapterId);
            if (idx !== -1) swiperRef.current.slideTo(idx);
        }
    };

    const handleSlideChange = (swiper: SwiperType) => {
        const index = swiper.activeIndex;
        if (episodes[index]) {
            setCurrentEpisode(episodes[index]);
        }
    };

    const handleVideoEnded = () => {
        // Auto scroll to next on finish
        if (isMobile && swiperRef.current) {
            swiperRef.current.slideNext();
        } else {
            const currentIndex = episodes.findIndex((e) => e.chapterId === currentEpisode.chapterId);
            if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                setCurrentEpisode(episodes[currentIndex + 1]);
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
                                        isActive={true} // Desktop always active
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

                            {/* Sidebar Logic */}
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

            {/* ================= MOBILE LAYOUT (SWIPER) ================= */}
            {isMobile && (
                <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col select-none">
                    {/* Header */}
                    {/* Header - Simple Floating Back Button */}
                    <div className="absolute top-0 left-0 w-full z-20 px-4 pt-safe mt-3 flex items-center justify-between pointer-events-none">
                        <Link href="/" className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition pointer-events-auto">
                            <ChevronRight size={24} className="rotate-180 -ml-0.5" />
                        </Link>
                    </div>

                    <Swiper
                        direction={'vertical'}
                        className="h-full w-full bg-black"
                        modules={[Mousewheel]}
                        mousewheel={true}
                        onSwiper={(swiper) => (swiperRef.current = swiper)}
                        onSlideChange={handleSlideChange}
                        initialSlide={episodes.findIndex(e => e.chapterId === currentEpisode.chapterId)}
                    >
                        {episodes.map((ep, index) => {
                            // Use lazy rendering: only render -1, 0, +1 slides around current
                            // Actually, let's just allow map, Swiper handles virtualization if configured, 
                            // but standard map is ok for <100 items. Logic for playing is key.
                            const isActive = currentEpisode.chapterId === ep.chapterId;

                            return (
                                <SwiperSlide key={ep.chapterId} className="h-full w-full relative">
                                    {/* Only mount/render video if it's close to active to save memory? 
                                        For now, render all but only PLAY active.
                                    */}
                                    <div className="h-full w-full relative">
                                        <VideoPlayer
                                            src={getVideoSrc(ep)}
                                            poster={dramaCover}
                                            isLocked={isLocked}
                                            onEnded={handleVideoEnded}
                                            isMobile={true}
                                            isActive={isActive}
                                        />

                                        {/* Footer Info Layer (Per Slide) - Floating Style */}
                                        <div className="absolute bottom-16 left-0 w-full z-20 px-5 pointer-events-none">
                                            <div className="mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                <h2 className="font-bold text-white text-lg mb-1 leading-tight">{dramaTitle}</h2>
                                                <p className="text-sm text-gray-200 line-clamp-2 leading-snug font-medium opacity-90">
                                                    {ep.chapterName || `Episode ${ep.chapterIndex + 1}`}
                                                </p>
                                            </div>

                                            {/* Floating Pill Button */}
                                            <div className="flex justify-end pointer-events-auto">
                                                <button
                                                    onClick={toggleMobileEpisodes}
                                                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95 shadow-lg"
                                                >
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                                    Watch More ({episodes.length})
                                                    <ChevronRight size={14} className="opacity-70" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {showMobileEpisodes && (
                        <div className="absolute inset-0 z-50">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileEpisodes(false)} />
                            <div className="absolute bottom-4 left-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-xl max-h-[60vh] flex flex-col animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 border border-white/10 rounded-3xl shadow-2xl pb-safe">
                                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-white">Episodes</h3>
                                    <button onClick={() => setShowMobileEpisodes(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition"><X size={20} /></button>
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
                                                    className={cn("aspect-square flex items-center justify-center text-sm font-bold transition-all relative border rounded-2xl", isActive ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20 shadow-lg scale-105" : "bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white border-white/5")}
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
