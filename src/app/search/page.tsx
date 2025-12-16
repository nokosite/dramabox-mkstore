"use client";

import { searchDramas, getTrendingDramas } from "@/lib/api";
import DramaList from "@/components/DramaList";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Search as SearchIcon, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Suspense } from "react";
import Image from "next/image";

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";

    // Local state for immediate typing feedback
    const [inputValue, setInputValue] = useState(query);
    const [results, setResults] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input with URL query
    useEffect(() => {
        setInputValue(query);
    }, [query]);

    // Fetch Trending on Mount
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const data = await getTrendingDramas();
                setTrending(data.slice(0, 6)); // Show top 6 trending
            } catch (e) {
                console.error(e);
            }
        };
        fetchTrending();
    }, []);

    // Perform Search
    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await searchDramas(query);
                setResults(data);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300); // 300ms debounce if we were debouncing locally, but here we depend on URL. 
        // Actually since we rely on URL, we just fetch immediately when URL changes.
        // But for typing, we need to handle the router.push debounce.

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (term: string) => {
        setInputValue(term);
        if (term.trim()) {
            router.push(`/search?q=${encodeURIComponent(term)}`);
        } else {
            router.push(`/search`);
        }
    };

    const clearSearch = () => {
        setInputValue("");
        router.push("/search");
        inputRef.current?.focus();
    };

    return (
        <main className="min-h-screen bg-[#121212] text-white pb-20">
            <Navbar />

            <div className="pt-24 px-4 container mx-auto max-w-4xl">
                {/* Search Header & Input */}
                <div className="sticky top-16 z-30 bg-[#121212] pb-4">
                    <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-3 shadow-lg focus-within:border-blue-500 transition-all">
                        <Link href="/" className="text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>

                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type to search dramas..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg"
                            value={inputValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />

                        {inputValue ? (
                            <button onClick={clearSearch} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        ) : (
                            <SearchIcon size={20} className="text-blue-500" />
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="mt-6">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : query ? (
                        results.length > 0 ? (
                            <div>
                                <h2 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Search Results</h2>
                                <DramaList dramas={results} title="" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <SearchIcon size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No results found</h3>
                                <p className="text-gray-400">Try searching for a different keyword</p>
                            </div>
                        )
                    ) : (
                        <div>
                            {/* Trending / Suggestions */}
                            {trending.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-bottom duration-500">
                                    <h2 className="flex items-center gap-2 text-white font-bold text-lg mb-4">
                                        <span className="text-blue-500">🔥</span> Trending Now
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {trending.map((drama) => (
                                            <Link
                                                key={drama.bookId}
                                                href={`/play?bookId=${drama.bookId}&title=${encodeURIComponent(drama.bookName)}&cover=${encodeURIComponent(drama.coverWap)}`}
                                                className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-xl hover:bg-[#222] transition group"
                                            >
                                                <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-800">
                                                    <Image src={drama.coverWap} alt={drama.bookName} fill className="object-cover group-hover:scale-110 transition duration-500" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-medium text-sm text-gray-200 truncate group-hover:text-blue-400 transition">{drama.bookName}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">Free to watch</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Categories Pills */}
                            <div className="mt-8">
                                <h2 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Popular Genres</h2>
                                <div className="flex flex-wrap gap-2">
                                    {["Romance", "CEO", "Revenge", "Love", "Family", "Modern"].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => handleSearch(tag)}
                                            className="px-4 py-2 bg-[#1a1a1a] border border-white/5 rounded-full text-sm hover:bg-white hover:text-black transition"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <SearchContent />
        </Suspense>
    );
}
