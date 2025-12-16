import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Strict pass-through for dashboard if authorized
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/", // Redirect to home if not authorized
        },
    }
);

// Only run middleware on dashboard to avoid touching public routes at all
// This is the safest way to prevent loops on / or /play
export const config = {
    matcher: ["/dashboard/:path*"]
};
