import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://dramabox.sansekai.my.id/api/dramabox";

// Force static to satisfy output: export. 
// This route is NOT used in the exported app (CLIENT), so it doesn't matter if it's broken in the build output.
export const dynamic = "force-static";

export function generateStaticParams() {
    return [{ path: ["static-placeholder"] }];
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    // Early return for Static Export build to avoid "Dynamic" usage errors
    if (process.env.NEXT_EXPORT === "true") {
        return new NextResponse("Static Proxy Placeholder");
    }

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
