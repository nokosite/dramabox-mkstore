import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const authOptions: NextAuthOptions = {
    debug: true,
    // @ts-ignore
    trustHost: true, // Fix for Vercel Redirect Loop
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // Fetch user by email
                const { data: user, error } = await supabaseAdmin
                    .from("users")
                    .select("*")
                    .eq("email", credentials.email)
                    .single();

                if (error || !user) {
                    throw new Error("User not found");
                }

                // Check if user has a password (might be Google-only user)
                if (!user.password) {
                    throw new Error("Please log in with Google");
                }

                // Verify Password
                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                // Return user object compatible with NextAuth
                return {
                    id: user.id || user.email,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            }
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
                // Check for Service Key availability
                if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. User data cannot be saved to Supabase.");
                    return true; // Allow login even if sync fails
                }

                console.log("🔄 Attempting to sync user to Supabase:", user.email);

                try {
                    // Use Admin client to bypass RLS policies
                    const { data, error } = await supabaseAdmin.from("users").upsert({
                        email: user.email!, // Email is required/primary key
                        name: user.name || "Anonymous",
                        image: user.image || "",
                        provider: "google",
                        created_at: new Date().toISOString(), // Ensure timestamps
                    }, { onConflict: "email" }).select();

                    if (error) {
                        console.error("❌ Supabase Upsert Error:", error.message, error.details);
                    } else {
                        console.log("✅ User synced to Supabase successfully:", data);
                    }
                } catch (e) {
                    console.error("❌ Supabase Sync Unexpected Failed:", e);
                }
            }
            return true;
        },
        async session({ session, token }) {
            return session;
        },
    },
};
