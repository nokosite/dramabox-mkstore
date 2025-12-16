import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    // Only check auth for dashboard
    // Note: The matcher handles this, but explicit check is safer
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Only run middleware on dashboard to avoid touching public routes at all
// This is the safest way to prevent loops on / or /play
export const config = {
    matcher: ["/dashboard/:path*"]
};
