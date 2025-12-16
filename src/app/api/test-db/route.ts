import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET() {
    const results = {
        env: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set (Hidden)" : "MISSING ❌",
        },
        connection: "Pending...",
        writeTest: "Pending...",
        error: null as any
    };

    try {
        // 1. Check Connection & Read
        const { data: readData, error: readError } = await supabaseAdmin.from("users").select("count", { count: "exact", head: true });

        if (readError) {
            results.connection = "FAILED ❌";
            results.error = readError;
            return NextResponse.json(results, { status: 500 });
        }
        results.connection = "SUCCESS ✅";

        // 2. Check Write (Admin Bypass)
        // We will try to upsert a dummy user to verify permissions
        const testEmail = "test-connection@dramabox.local";
        const { data: writeData, error: writeError } = await supabaseAdmin.from("users").upsert({
            email: testEmail,
            name: "Supabase Connection Test",
            provider: "test",
            created_at: new Date().toISOString()
        }, { onConflict: "email" }).select();

        if (writeError) {
            results.writeTest = "FAILED ❌";
            results.error = writeError;
            return NextResponse.json(results, { status: 500 });
        }

        results.writeTest = "SUCCESS ✅";

        // Clean up test user
        await supabaseAdmin.from("users").delete().eq("email", testEmail);

        return NextResponse.json(results, { status: 200 });

    } catch (e: any) {
        results.error = e.message;
        return NextResponse.json(results, { status: 500 });
    }
}
