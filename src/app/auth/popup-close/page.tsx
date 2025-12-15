"use client";

import { useEffect } from "react";

export default function PopupClose() {
    useEffect(() => {
        if (window.opener) {
            // Send message to main window
            window.opener.postMessage("google-login-success", "*");
            // Close popup
            window.close();
        } else {
            // Fallback if not opened as popup
            window.location.href = "/";
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
            <p className="animate-pulse">Authenticating...</p>
        </div>
    );
}
