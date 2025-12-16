"use client";



import Link from "next/link"; // Keep only one Link
import { Search, User, Headphones, LogOut, Menu, X } from "lucide-react"; // Keep only one import set
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";

export default function Navbar() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(""); // Optional: clear after search? Maybe better to keep it.
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 w-full z-50 bg-[#121212] border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo & Menu */}
                    <div className="flex items-center gap-8">
                        {/* Mobile Menu Button - Hidden since we use Bottom Nav */}
                        <button
                            className="hidden text-white p-1" // Changed md:hidden to hidden
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>

                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                M
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">MKX</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/" className="text-blue-500 hover:text-blue-400">Beranda</Link>

                            <Link href="#" className="hover:text-white transition">Aplikasi</Link>
                            <button className="flex items-center gap-1 hover:text-white transition">
                                <Headphones size={16} />
                                <span>Layanan</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Search + Profile */}
                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <input
                                type="text"
                                placeholder="Mencari"
                                className="bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 w-48 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>

                        {session ? (
                            <div className="flex items-center gap-3 relative">
                                {/* User Dropdown Trigger */}
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    {session.user?.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                            fill
                                            sizes="32px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                            {session.user?.name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className="absolute top-12 right-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2 border-b border-white/5 mb-2">
                                            <p className="text-sm font-bold text-white truncate">{session.user?.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                                        </div>

                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            <User size={16} />
                                            Dashboard
                                        </Link>

                                        <button
                                            onClick={() => signOut()}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition text-left"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-white/10 transition text-white"
                                title="Sign In with Google"
                            >
                                <User size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md md:hidden animate-in fade-in duration-200">
                    <div className="fixed top-0 left-0 w-3/4 max-w-sm h-full bg-[#121212] border-r border-white/10 p-6 shadow-2xl animate-in slide-in-from-left duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-2xl font-bold text-white">Menu</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 text-lg font-medium text-gray-300">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-500">Beranda</Link>

                            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Aplikasi</Link>
                            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Layanan</Link>
                        </div>

                        {/* Mobile Search */}
                        <div className="mt-8">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari drama..."
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch(e);
                                            setMobileMenuOpen(false);
                                        }
                                    }}
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />

            {/* Bottom Navigation (Mobile Only) */}
            {/* Bottom Navigation (Mobile Only) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#121212] border-t border-white/10 px-6 py-2 z-50 flex items-center justify-between pb-safe">
                <Link href="/" className="flex flex-col items-center gap-1 text-blue-500">
                    <div className="p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </div>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link href="/search" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
                    <div className="p-1 rounded-full">
                        <Search size={24} />
                    </div>
                    <span className="text-[10px] font-medium">Search</span>
                </Link>

                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
                    <div className="p-1 rounded-full">
                        <Headphones size={24} />
                    </div>
                    <span className="text-[10px] font-medium">Shorts</span>
                </button>

                {session ? (
                    <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-600 relative">
                            {session.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Me"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs text-white">
                                    {session.user?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Me</span>
                    </Link>
                ) : (
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
                    >
                        <div className="p-1 rounded-full">
                            <User size={24} />
                        </div>
                        <span className="text-[10px] font-medium">Me</span>
                    </button>
                )}
            </div>
        </>
    );
}
