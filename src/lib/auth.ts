import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabaseClient";

export const authOptions: NextAuthOptions = {
    debug: true,
    // @ts-ignore
    trustHost: true, // Fix for Vercel Redirect Loop
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `__Secure-dramabox.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: true,
            },
        },
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    const { error } = await supabase.from("users").upsert({
                        email: user.email!,
                        name: user.name || "",
                        image: user.image || "",
                        provider: "google",
                    }, { onConflict: "email" });

                    if (error) console.error("Supabase Sync Error:", error);
                } catch (e) {
                    console.error("Supabase Sync Failed:", e);
                }
            }
            return true;
        },
        async session({ session, token }) {
            return session;
        },
    },
};
