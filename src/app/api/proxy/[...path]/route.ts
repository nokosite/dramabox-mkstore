import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api-drmbox.mkstore.id/api"; // Updated to new API

// Dynamic Proxy for Vercel
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {


    const params = await props.params;
    const { path } = await params;
    const pathStr = path.join("/");
    const searchParams = req.nextUrl.search; // includes ?query=...

    // New API structure matches the proxy path mostly, but we need to ensure paths align.
    // Frontend calls: /api/proxy/foryou -> /api/home?lang=en
    // But wait, the frontend paths in api.ts are like `/foryou`, `/allepisode`.
    // The new API has `/home`, `/movie`, `/search`.
    // We will refactor api.ts to call the correct paths, so the proxy just forwards what it gets.
    // So if api.ts calls /api/proxy/home -> forwards to /api/home. Good.

    const targetUrl = `${API_BASE}/${pathStr}${searchParams}`;

    // console.log(`[Proxy] Forwarding to: ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // Inject the API KEY here
                "x-api-key": "MK-D04F5F9750BCE8D27A6671E81F6041F9",
                // Forward important headers if needed
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
