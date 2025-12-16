import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://dramabox.sansekai.my.id/api/dramabox";

// Dynamic Proxy for Vercel
export const dynamic = "force-dynamic"; // Ensure it runs dynamically

const params = await props.params;
const { path } = await params;
const pathStr = path.join("/");
const searchParams = req.nextUrl.search; // includes ?query=...

const targetUrl = `${API_BASE}/${pathStr}${searchParams}`;

// console.log(`[Proxy] Forwarding to: ${targetUrl}`);

try {
    const response = await fetch(targetUrl, {
        headers: {
            // Forward important headers if needed, or just keep it simple
            // "User-Agent": req.headers.get("user-agent") || "NextJS-Proxy",
        },
        cache: "no-store"
    });

    // Get the data
    const data = await response.arrayBuffer();

    // Create new response with the data and upstream headers
    const res = new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
    });

    // Copy content-type
    res.headers.set("Content-Type", response.headers.get("Content-Type") || "application/json");

    // CORS for local dev
    res.headers.set("Access-Control-Allow-Origin", "*");

    return res;

} catch (error: any) {
    console.error("[Proxy Error]", error);
    return NextResponse.json({ error: "Proxy Failed", details: error.message }, { status: 500 });
}
}
