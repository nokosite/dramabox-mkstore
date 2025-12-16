"use client";

import DramaClientPage from "@/components/DramaClientPage";
import { Suspense } from "react";

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <DramaClientPage />
        </Suspense>
    );
}
