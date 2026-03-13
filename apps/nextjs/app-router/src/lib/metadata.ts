import { Metadata } from "next";

export const metadataInfo: Metadata = {
    title: {
        default: "Aura Auth | Next.js Integration Example",
        template: "%s | Aura Auth",
    },
    description:
        "Comprehensive authentication for TypeScript applications. Built for speed, security, and developer experience. Powered by Aura Auth Core.",
    keywords: ["Next.js", "Authentication", "Aura Auth", "TypeScript", "OAuth", "Session Management", "Security"],
    authors: [{ name: "Aura Stack", url: "https://github.com/aura-stack-ts" }],
    creator: "Aura Stack",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://aura-stack-auth.vercel.app/",
        siteName: "Aura Auth",
        title: "Aura Auth | Next.js Integration",
        description:
            "Seamlessly integrate secure authentication into your Next.js apps with Aura Auth Core. Supports OAuth and server-side sessions.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Aura Auth | Next.js Integration",
        description: "Secure authentication for Next.js powered by Aura Auth Core. Fast, secure, and developer-friendly.",
        creator: "@aurastackjs",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
}