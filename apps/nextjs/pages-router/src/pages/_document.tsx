import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
    const title = "Aura Auth | Next.js Pages Router Integration"
    const description =
        "Comprehensive authentication for TypeScript applications. Built for speed, security, and developer experience. Powered by Aura Auth Core."
    const url = "https://aura-stack-auth.vercel.app/"

    return (
        <Html className="dark" lang="en">
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta
                    name="keywords"
                    content="Next.js, Next.js Pages Router, Authentication, Aura Auth, TypeScript, OAuth, Session Management, Security"
                />
                <meta name="author" content="Aura Stack" />
                <link rel="canonical" href={url} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={url} />
                <meta property="og:site_name" content="Aura Auth" />
                <meta property="og:title" content="Aura Auth | Next.js Pages Router Integration" />
                <meta
                    property="og:description"
                    content="Seamlessly integrate secure authentication into your Next.js apps with Aura Auth Core. Supports OAuth and server-side sessions."
                />
                <meta property="og:locale" content="en_US" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@aurastackjs" />
                <meta name="twitter:creator" content="@aurastackjs" />
                <meta name="twitter:title" content="Aura Auth | Next.js Pages Router Integration" />
                <meta
                    name="twitter:description"
                    content="Secure authentication for Next.js powered by Aura Auth Core. Fast, secure, and developer-friendly."
                />
                <meta name="robots" content="index, follow" />
                <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
            </Head>
            <body className="antialiased">
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
