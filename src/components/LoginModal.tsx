"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError(res.error);
            } else {
                onClose();
                window.location.reload(); // Refresh to update session
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Auto-login after register
            await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            onClose();
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition bg-white/5 rounded-full p-2 z-10"
                >
                    <X size={20} />
                </button>

                {/* Banner / Header */}
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-8 pb-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">MKX</h2>
                    <p className="text-blue-200/70 text-sm">Premium Short Drama Streaming</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "login" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => { setActiveTab("login"); setError(""); }}
                    >
                        Sign In
                        {activeTab === "login" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                    </button>
                    <button
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "register" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => { setActiveTab("register"); setError(""); }}
                    >
                        Register
                        {activeTab === "register" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={activeTab === "login" ? handleLogin : handleRegister} className="space-y-4">

                        {activeTab === "register" && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl text-white font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 ${loading ? "bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 hover:scale-[1.02]"
                                }`}
                        >
                            {loading && <Loader2 className="animate-spin" size={20} />}
                            {activeTab === "login" ? "Sign In to Account" : "Create Account"}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Or continue with</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <button
                        onClick={() => signIn("google")}
                        className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-3 group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google Account
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        By continuing, you agree to our <a href="#" className="underline hover:text-white">Terms</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
