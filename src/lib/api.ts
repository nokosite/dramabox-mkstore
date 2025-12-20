
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
  const url = new URL(`${API_BASE}/api${endpoint}`);

  // Default params
  if (!params.lang) params.lang = "en";
  if (!params.source) params.source = "dramabox"; // Default source

  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
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
function mapGoodshortItem(item: any): Drama {
  // Adaptation based on typical GoodShort fields (to be verified)
  return {
    bookId: item.bookId || item.id,
    bookName: item.bookName || item.title,
    coverWap: item.cover || item.coverUrl,
    introduction: item.introduction || item.intro,
    chapterCount: item.chapterCount || item.episodesCount,
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
    // GoodShort structure from Project 27 analysis
    list = json.data.bookList || json.data || [];
    return list.map(mapGoodshortItem);
  }
}

export async function getTrendingDramas(source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  const json = await fetchFromApi(`/${source}/home`, { source });
  if (!json?.data) return [];

  if (source === "dramabox") {
    const list = json.data.bigList || [];
    return list.map(mapDramaboxItem);
  } else {
    // Fallback for Goodshort (maybe they don't have bigList, use normal list)
    const list = json.data.bookList || [];
    return list.map(mapGoodshortItem);
  }
}

export async function getLatestDramas(source: "dramabox" | "goodshort" = "dramabox"): Promise<Drama[]> {
  // For Dramabox we use Genre 260. For Goodshort we might use a different endpoint or default home
  if (source === "dramabox") {
    const json = await fetchFromApi(`/dramabox/genre`, { id: "260" });
    const list = json?.data?.bookList || [];
    return list.map(mapDramaboxItem);
  } else {
    // Goodshort Latest logic (placeholder)
    return getForYouDramas("goodshort");
  }
}

export async function getDramaEpisodes(bookId: string, source: "dramabox" | "goodshort" = "dramabox"): Promise<Episode[]> {
  const json = await fetchFromApi(`/${source}/movie`, { id: bookId, source });
  if (!json?.data) return [];

  if (source === "dramabox") {
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
    const chapters = json.data.chapterList || [];
    return chapters.map((ch: any) => ({
      chapterId: ch.id,
      chapterIndex: ch.index,
      chapterName: ch.name,
      isCharge: 0, // Assume free for now
      cdnList: [{
        videoPathList: [{
          quality: 720,
          videoPath: ch.url || "", // Verify field name
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
    const list = json?.data || [];
    return list.map(mapGoodshortItem);
  }
}
