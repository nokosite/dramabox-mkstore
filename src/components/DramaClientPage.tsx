"use client";

import { getDramaEpisodes } from "@/lib/api";
import Link from "next/link";
import DramaPlayer from "@/components/DramaPlayer";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function DramaContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    // Safely handle bookId which might be an array or string
    const bookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;
    const title = searchParams.get("title") || undefined;
    const cover = searchParams.get("cover") || undefined;

    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!bookId) return;
            setLoading(true);
            try {
                const data = await getDramaEpisodes(bookId);
                if (!data || data.length === 0) {
                    setError(true);
                } else {
                    setEpisodes(data);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodes();
    }, [bookId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || episodes.length === 0) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4 text-white">Drama Currently Unavailable</h1>
                <p className="text-gray-400 mb-8 max-w-md text-center">
                    We are experiencing issues connecting to the server for this specific drama. Please try again later or browse other dramas.
                </p>
                <Link href="/" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                    <ArrowLeft size={18} /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <main className="bg-[#121212] min-h-screen">
            <Navbar />
            <DramaPlayer
                initialEpisodes={episodes}
                bookId={bookId || ""}
                dramaTitle={title}
                dramaCover={cover}
            />
        </main>
    );
}

export default function DramaClientPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <DramaContent />
        </Suspense>
    );
}
