
export interface Drama {
  bookId: string;
  bookName: string;
  coverWap: string;
  introduction?: string;
  tags?: string[];
  playCount?: string;
  chapterCount?: number;
  source?: "dramabox" | "goodshort"; // Track source for linking
}

export interface Episode {
  chapterId: string;
  chapterIndex: number;
  chapterName: string;
  isCharge: number;
  cdnList: {
    videoPathList: {
      quality: number;
      videoPath: string;
      isDefault: number;
    }[];
  }[];
}

const API_BASE = process.env.API_BASE_URL || "https://api-dramabox.mkstore.id";
const API_KEY = process.env.API_SECRET || "";

// Helper for Centralized Fetching
async function fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
  const isServer = typeof window === "undefined";

  // Construct Base URL:
  // Server: Direct to External API (Fastest)
  // Client: Via Internal Proxy (Avoids CORS)
  // Proxy Route: /api/proxy/[endpoint] -> forwards to [API_BASE]/api/[endpoint]

  let baseUrl;
  if (isServer) {
    baseUrl = `${API_BASE}/api${endpoint}`;
  } else {
    // Client-side proxy URL construction
    // Endpoint usually starts with slash, e.g., /dramabox/home
    // We want /api/proxy/dramabox/home
    baseUrl = `/api/proxy${endpoint}`;
  }

  const url = new URL(baseUrl, isServer ? undefined : window.location.origin);

  // Default params
  if (!params.lang) params.lang = "en";
  if (!params.source) params.source = "dramabox"; // Default source

  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };

    // Only add API Key server-side.
    // Client-side, the Proxy adds it!
    if (isServer) {
      headers["x-api-key"] = API_KEY;
    }

    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      console.error(`[API Error] ${res.status} ${res.statusText} - ${url.toString()}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("[Fetch Error]", error);
    return null;
  }
}

// --- DATA MAPPING HELPERS ---

function mapDramaboxItem(item: any): Drama {
  return {
    bookId: item.bookId,
    bookName: item.bookName,
    coverWap: item.cover,
    introduction: item.introduction,
    chapterCount: item.chapterCount,
    source: "dramabox"
  };
}

// GoodShort structure might differ, simplified mapping for now
// GoodShort structure from Project 27 analysis
// item is from data.bookList[].items[]
function mapGoodshortItem(item: any): Drama {
  return {
    bookId: item.bookId || item.id,
    bookName: item.bookName || item.title || item.seoBookName,
    coverWap: item.bannerUrl || item.coverUrl || item.cover || "https://placehold.co/300x400?text=No+Cover",
    introduction: item.introduction || item.intro || "",
    chapterCount: item.chapterCount || 0,
    source: "goodshort"
  };
}

// --- PUBLIC FUNCTIONS ---

export async function getForYouDramas(source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  const json = await fetchFromApi(`/${source}/home`, { source });
  if (!json?.data) return [];

  // Dramabox: data.pageProps.smallData
  // GoodShort: data (direct list?) -> need to verify structure, assuming generic list for now

  let list = [];
  if (source === "dramabox") {
    list = json.data.smallData || [];
    return list.map(mapDramaboxItem);
  } else {
    // GoodShort structure: data.bookList is an array of sections (Banner, Trending, etc)
    // We want to extract items from these sections
    const sections = json.data?.bookList || [];
    // Flatten all items from all sections for "For You"
    // Or just pick specific sections if we knew their IDs. For now, grab all.
    const allItems = sections.flatMap((sec: any) => sec.items || []);
    return allItems.map(mapGoodshortItem);
  }
}

export async function getTrendingDramas(source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  const json = await fetchFromApi(`/${source}/home`, { source });
  if (!json?.data) return [];

  if (source === "dramabox") {
    const list = json.data.bigList || [];
    return list.map(mapDramaboxItem);
  } else {
    // GoodShort Trending: Use the first non-banner section or just the second section?
    // Let's rely on the same structure for now, maybe slice the list differently
    const sections = json.data?.bookList || [];
    const allItems = sections.flatMap((sec: any) => sec.items || []);
    return allItems.slice(0, 10).map(mapGoodshortItem);
  }
}

export async function getLatestDramas(source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  // For Dramabox we use Genre 260. For Goodshort we might use a different endpoint or default home
  if (source === "dramabox") {
    const json = await fetchFromApi(`/dramabox/genre`, { id: "260" });
    const list = json?.data?.bookList || [];
    return list.map(mapDramaboxItem);
  } else {
    // Goodshort Latest
    return getForYouDramas("goodshort");
  }
}

export async function getDramaEpisodes(bookId: string, source: "dramabox" | "goodshort" = "dramabox"): Promise<Episode[]> {
  // Helpers
  const isGoodShortId = (id: string) => id.length > 9 && /^\d+$/.test(id); // Heuristic: GoodShort IDs are long numbers

  // Heuristic Override: If Source is Dramabox but ID looks like GoodShort, switch.
  // This fixes stale links or user errors.
  let effectiveSource = source;
  if (source === "dramabox" && isGoodShortId(bookId)) {
    effectiveSource = "goodshort";
  }

  let json = await fetchFromApi(`/${effectiveSource}/movie`, { id: bookId, source: effectiveSource });

  // Retry logic: If no data, try the other source just in case
  if (!json?.data) {
    const otherSource = effectiveSource === "dramabox" ? "goodshort" : "dramabox";
    json = await fetchFromApi(`/${otherSource}/movie`, { id: bookId, source: otherSource });
    if (json?.data) effectiveSource = otherSource; // Update effective source for mapping
  }

  if (!json?.data) return [];

  // Mapping based on the SUCCESSFUL source (effectiveSource)
  if (effectiveSource === "dramabox") {
    const chapters = json.data.chapterList || [];
    return chapters.map((ch: any) => ({
      chapterId: ch.id,
      chapterIndex: ch.index,
      chapterName: ch.name,
      isCharge: ch.unlock ? 0 : 1,
      cdnList: [{
        videoPathList: [{
          quality: 720,
          videoPath: ch.mp4 || "",
          isDefault: 1
        }]
      }]
    }));
  } else {
    // GoodShort Episode Mapping
    // API returns 'chapterVoList', video is 'm3u8Path'
    const chapters = json.data.chapterVoList || json.data.chapterList || [];
    return chapters.map((ch: any) => ({
      chapterId: ch.id,
      chapterIndex: ch.index,
      chapterName: ch.name,
      isCharge: ch.price > 0 ? 1 : 0,
      cdnList: [{
        videoPathList: [{
          quality: 720,
          videoPath: ch.m3u8Path || ch.url || "",
          isDefault: 1
        }]
      }]
    }));
  }
}

export async function searchDramas(query: string, source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  const json = await fetchFromApi(`/${source}/search`, { q: query, source });

  if (source === "dramabox") {
    const list = json?.data?.list || [];
    return list.map(mapDramaboxItem);
  } else {
    const data = json?.data || {};
    const list = [...(data.topList || []), ...(data.bottomList || [])];
    return list.map(mapGoodshortItem);
  }
}
