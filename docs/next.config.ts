import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"

const withMDX = createMDX()

const config: NextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: "/docs/:path*.mdx",
                destination: "/llms.mdx/:path*",
            },
        ]
    },
    redirects: async () => [
        {
            source: "/docs",
            destination: "/docs/introduction",
            permanent: true,
        },
    ],
}

export default withMDX(config)
