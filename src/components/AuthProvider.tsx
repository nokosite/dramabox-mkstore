"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Define simpler Session type for client-side usage
interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

interface Session {
    user?: User;
    expires: string;
}

interface AuthContextType {
    data: Session | null;
    status: "authenticated" | "loading" | "unauthenticated";
    signIn: (provider?: string) => Promise<void>;
    signOut: () => Promise<void>;
    update: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    data: null,
    status: "loading",
    signIn: async () => { },
    signOut: async () => { },
    update: async () => { },
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<"authenticated" | "loading" | "unauthenticated">("loading");

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem("dramabox_user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setSession({
                    user,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                });
                setStatus("authenticated");
            } catch (e) {
                setStatus("unauthenticated");
            }
        } else {
            setStatus("unauthenticated");
        }
    }, []);

    const signIn = async (provider?: string) => {
        // Mock Login for Static Export
        // In a real static app, you'd redirect to an Identity Provider returning a token, or use Firebase.
        // For this demo/fix, we set a "Demo User".
        const mockUser: User = {
            name: "Pengguna Drama",
            email: "user@dramabox.id",
            image: "", // Placeholder or kept empty to show initial
        };

        localStorage.setItem("dramabox_user", JSON.stringify(mockUser));
        setSession({
            user: mockUser,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        setStatus("authenticated");
    };

    const signOut = async () => {
        localStorage.removeItem("dramabox_user");
        setSession(null);
        setStatus("unauthenticated");
    };

    const update = async () => { };

    return (
        <AuthContext.Provider value={{ data: session, status, signIn, signOut, update }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to replace useSession
export function useAuth() {
    return useContext(AuthContext);
}
