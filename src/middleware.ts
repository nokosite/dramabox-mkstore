import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
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

export const config = {
    matcher: ["/dashboard/:path*"]
};
