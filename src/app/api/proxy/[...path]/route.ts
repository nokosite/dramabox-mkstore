import { NextRequest, NextResponse } from "next/server";

// Use environment variable or fallback
const API_BASE = process.env.API_BASE_URL || "https://api-dramabox.mkstore.id";
const API_KEY = process.env.API_SECRET || "";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    const { path } = params;

    // Construct target path (e.g., /api/dramabox/home)
    // The incoming request is /api/proxy/dramabox/home
    // path parameter will be ['dramabox', 'home']
    const pathStr = path.join("/");
    const searchParams = req.nextUrl.search; // includes ?query=...

    // Target: https://api-dramabox.mkstore.id/api/dramabox/home?lang=en
    const targetUrl = `${API_BASE}/api/${pathStr}${searchParams}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
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

        return res;

    } catch (error: any) {
        console.error("[Proxy Error]", error);
        return NextResponse.json({ error: "Proxy Failed", details: error.message }, { status: 500 });
    }
}
