export interface Drama {
  bookId: string;
  bookName: string;
  coverWap: string;
  introduction?: string;
  tags?: string[];
  playCount?: string;
  chapterCount?: number;
  // Add other fields as needed
}

export interface ApiResponse {
  // The API seems to return an array directly based on the curl output
  // but usually APIs return a wrapped object.
  // The curl output showed: [{"isEntry":0, ...}, ...]
  // So it returns Drama[] directly.
}

const BASE_URL = 'https://dramabox.sansekai.my.id/api/dramabox';

export async function getForYouDramas(): Promise<Drama[]> {
  try {
    const res = await fetch(`${BASE_URL}/foryou`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    } as any);

    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }

    // The API returns a mixed array where some items contain nested 'tagBooks'.
    // We need to parse this carefully.
    const data = await res.json();

    // Flatten the data to get a consistent list of dramas
    // From the curl output:
    // Item 0: { dataFrom: "算法_推荐剧", tagCardVo: { tagBooks: [...] } } -> Specific structure
    // Item 1: { bookId: "...", bookName: "...", ... } -> Direct drama object

    let dramas: Drama[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.tagCardVo && item.tagCardVo.tagBooks) {
          // It's a collection card, extract books from here
          dramas.push(...item.tagCardVo.tagBooks);
        } else if (item.bookId) {
          // It's a direct drama item
          dramas.push(item);
        }
      });
    }

    return dramas;
  } catch (error) {
    console.error('Error fetching For You dramas:', error);
    return [];
  }
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

export async function getDramaEpisodes(bookId: string): Promise<Episode[]> {
  try {
    // Note: This endpoint might be slower as it fetches all episodes.
    const res = await fetch(`${BASE_URL}/allepisode?bookId=${bookId}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`[API Error] Failed to fetch episodes for bookId ${bookId}. Status: ${res.status} ${res.statusText}`);
      // Try to read text if possible for more info
      try {
        const text = await res.text();
        console.error(`[API Error Body]`, text.slice(0, 200));
      } catch (e) { /* ignore */ }

      throw new Error(`Failed to fetch episodes: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
}

export async function getTrendingDramas(): Promise<Drama[]> {
  return fetchDramas(`${BASE_URL}/trending`);
}

export async function getLatestDramas(): Promise<Drama[]> {
  return fetchDramas(`${BASE_URL}/latest`);
}

export async function searchDramas(query: string): Promise<Drama[]> {
  return fetchDramas(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
}

// Helper to reuse the parsing logic
async function fetchDramas(url: string): Promise<Drama[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit & { next?: { revalidate?: number } });
    if (!res.ok) throw new Error('Failed to fetch');

    const data = await res.json();
    let dramas: Drama[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.tagCardVo && item.tagCardVo.tagBooks) {
          // Process nested dramas
          const nested = item.tagCardVo.tagBooks.map((d: any) => ({
            ...d,
            coverWap: d.coverWap || d.cover // Normalize cover field
          }));
          dramas.push(...nested);
        } else if (item.bookId) {
          // Process direct drama object
          item.coverWap = item.coverWap || item.cover; // Normalize cover field
          dramas.push(item);
        }
      });
    }
    return dramas;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return [];
  }
}
