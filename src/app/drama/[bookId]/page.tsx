import { getDramaEpisodes } from "@/lib/api";
import Link from "next/link";
import DramaPlayer from "@/components/DramaPlayer";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function DramaPage({
    params,
    searchParams,
}: {
    params: { bookId: string };
    searchParams: { title?: string; cover?: string };
}) {
    const { bookId } = await params;
    const { title, cover } = await searchParams;
    let episodes: any[] = [];
    try {
        episodes = await getDramaEpisodes(bookId);
    } catch (error) {
        console.error("Error fetching episodes:", error);
        // Continue with empty episodes to show error UI
    }

    if (episodes.length === 0) {
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
                bookId={bookId}
                dramaTitle={title}
                dramaCover={cover}
            />
        </main>
    );
}
