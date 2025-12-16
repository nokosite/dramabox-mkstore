import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        check_time: new Date().toISOString(),
        env_check: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || "MISSING",
            NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
            GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
        }
    });
}
