"use client";

import { searchDramas } from "@/lib/api";
import DramaList from "@/components/DramaList";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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

        fetchResults();
    }, [query]);

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 px-4 container mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold">
                        {query ? `Results for "${query}"` : "Search Dramas"}
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : query ? (
                    results.length > 0 ? (
                        <DramaList dramas={results} title="" />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <p className="text-xl">No dramas found matching your search.</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <p className="text-xl">Type in the search bar to find dramas.</p>
                    </div>
                )}
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
