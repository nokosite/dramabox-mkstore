
import DramaClientPage from "@/components/DramaClientPage";

// Required for static export
export function generateStaticParams() {
    // In a real static export, we would fetch ALL bookIds here.
    // For this wrapper purpose, we return a dummy or empty to satisfy the build.
    return [{ bookId: "static-placeholder" }];
}

export default function DramaPage() {
    return <DramaClientPage />;
}
