import FeaturedSection from "@/components/FeaturedSection";
import DramaList from "@/components/DramaList";
import Navbar from "@/components/Navbar";
import { getForYouDramas, getTrendingDramas, getLatestDramas } from "@/lib/api";

export default async function Home() {
  const forYou = await getForYouDramas();
  const trending = await getTrendingDramas();
  const latest = await getLatestDramas();

  return (
    <main className="min-h-screen bg-[#121212] pt-16">
      <Navbar />

      {/* Featured Section uses Trending data for "Spotlight" feel */}
      <FeaturedSection dramas={trending} />

      <div className="space-y-4 md:space-y-12 pb-20">
        <DramaList dramas={forYou} title="Recommended For You" />
        <DramaList dramas={trending} title="Trending Now" />
        <DramaList dramas={latest} title="New Releases" />
      </div>
    </main>
  );
}
