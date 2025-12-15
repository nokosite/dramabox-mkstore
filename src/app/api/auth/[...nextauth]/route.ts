import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Forced static for export build. 
// Note: This effectively disables Auth API in static export, which is expected.
export const dynamic = "force-static";

export function generateStaticParams() {
    return [{ nextauth: ["session"] }];
}

export { handler as GET, handler as POST };
