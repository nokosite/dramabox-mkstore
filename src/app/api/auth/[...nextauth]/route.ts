import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Forced static for export build. 
export const dynamic = "force-static"; // Uncommented for export

export function generateStaticParams() {
    return [{ nextauth: ["session"] }];
}

export { handler as GET, handler as POST };
