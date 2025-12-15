import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LogOut, History, Heart, Settings, User } from "lucide-react";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-[#121212] pt-20 pb-10">
            <Navbar />

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-600 relative">
                            {session.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white">
                                    {session.user?.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{session.user?.name}</h1>
                            <p className="text-gray-400">{session.user?.email}</p>
                        </div>
                    </div>

                    {/* Grid Menu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* History */}
                        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 hover:border-blue-600/50 transition group cursor-pointer">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 rounded-lg bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition">
                                    <History size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Riwayat Nonton</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Lanjutkan drama yang terakhir Anda tonton.</p>
                        </div>

                        {/* Favorites */}
                        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 hover:border-pink-600/50 transition group cursor-pointer">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 rounded-lg bg-pink-600/10 text-pink-500 group-hover:bg-pink-600 group-hover:text-white transition">
                                    <Heart size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Favorit Saya</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Daftar drama yang Anda simpan.</p>
                        </div>

                        {/* Profile Settings */}
                        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 hover:border-green-600/50 transition group cursor-pointer">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 rounded-lg bg-green-600/10 text-green-500 group-hover:bg-green-600 group-hover:text-white transition">
                                    <Settings size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Pengaturan Akun</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Ubah profil dan preferensi aplikasi.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
