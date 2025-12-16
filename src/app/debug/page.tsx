import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const session = await getServerSession(authOptions);

    // Safe environment check (masking secrets)
    const envCheck = {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set ✅" : "Missing ❌",
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // Check which key is actually loaded
        SUPABASE_ANON_KEY_START: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
        SUPABASE_SERVICE_ROLE_KEY_START: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + "..."
            : "MISSING ❌",
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-3xl font-bold text-red-500 mb-6">🕵️‍♂️ Auth & Env Debugger</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Section 1: Session Status */}
                <div className="border border-white/20 p-6 rounded-xl bg-white/5">
                    <h2 className="text-xl font-bold mb-4 text-blue-400">1. NextAuth Session</h2>
                    <p className="mb-2 text-gray-400">
                        Status: {session ? <span className="text-green-500 font-bold">LOGGED IN ✅</span> : <span className="text-yellow-500 font-bold">NOT LOGGED IN ⚠️</span>}
                    </p>
                    <pre className="bg-black p-4 rounded-lg overflow-auto text-xs border border-white/10">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                    <p className="mt-4 text-sm text-gray-400">
                        *If this says "Logged In", it means Google accepted your credentials.
                        This happens INDEPENDENTLY of Supabase.
                    </p>
                </div>

                {/* Section 2: Environment Variables */}
                <div className="border border-white/20 p-6 rounded-xl bg-white/5">
                    <h2 className="text-xl font-bold mb-4 text-purple-400">2. Server Environment</h2>
                    <div className="space-y-2 text-sm">
                        {Object.entries(envCheck).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">{key}:</span>
                                <span className="font-bold">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Explanation */}
                <div className="col-span-full border border-yellow-500/30 p-6 rounded-xl bg-yellow-900/10">
                    <h2 className="text-xl font-bold mb-2 text-yellow-500">💡 Why can I login if Supabase Auth is disabled?</h2>
                    <p className="text-gray-300 leading-relaxed">
                        Because you are <strong>NOT</strong> using Supabase Auth.
                        <br /><br />
                        You are using <strong>NextAuth (Google)</strong>.
                        When you login, NextAuth talks directly to Google.
                        <br /><br />
                        <strong>Supabase's Role:</strong> We only use Supabase as a <strong>Database</strong> to store user history.
                        We do NOT use it to check passwords or verify emails.
                        <br />
                        That is why disabling "Supabase Auth" does not stop "NextAuth Login".
                    </p>
                </div>
            </div>
        </div>
    );
}
