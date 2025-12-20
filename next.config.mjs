/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    trailingSlash: false,
    output: process.env.NEXT_EXPORT === "true" ? "export" : undefined,
    images: {
        unoptimized: true, // Required for static export
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'hwztchapter.dramaboxdb.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: "https",
                hostname: "*.googleusercontent.com",
            },
        ],
    },
};

export default nextConfig;
