import FeaturedSection from "@/components/FeaturedSection";
import DramaList from "@/components/DramaList";
import Navbar from "@/components/Navbar";
import { getForYouDramas, getTrendingDramas, getLatestDramas } from "@/lib/api";

export default async function Home({ searchParams }: { searchParams: { source?: "dramabox" | "goodshort" } }) {
  const source = searchParams.source || "dramabox";

  const forYou = await getForYouDramas(source);
  const trending = await getTrendingDramas(source);
  const latest = await getLatestDramas(source);

  return (
    <main className="min-h-screen bg-[#121212] pt-16">
      <Navbar />

      {/* Featured Section uses Trending data for "Spotlight" feel */}
      <FeaturedSection dramas={trending} />

      <div className="space-y-4 md:space-y-12 pb-20">
        <DramaList dramas={forYou} title={source === "dramabox" ? "Recommended For You" : "GoodShort Picks"} />
        <DramaList dramas={trending} title="Trending Now" />
        <DramaList dramas={latest} title="New Releases" />
      </div>
    </main>
  );
}
