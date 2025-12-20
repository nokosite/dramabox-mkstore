import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip auth check for API routes and static files to prevent loops
    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Only check auth for dashboard
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token && pathname.startsWith("/dashboard")) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"]
};
