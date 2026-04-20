import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "gitlab.com",
            },
            {
                protocol: "https",
                hostname: "bitbucket.org",
            },
        ],
    },
}

export default nextConfig
