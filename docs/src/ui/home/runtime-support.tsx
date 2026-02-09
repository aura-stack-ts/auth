import { Check } from "lucide-react"

const runtimes = [
    {
        name: "Node.js",
        logo: (
            <svg className="size-10" viewBox="0 0 256 289" fill="none">
                <path
                    d="M128 288.464c-3.975 0-7.685-1.06-11.13-2.915l-35.247-20.936c-5.3-2.915-2.65-3.975-1.06-4.505 7.155-2.385 8.48-2.915 15.9-7.156.796-.53 1.856-.265 2.65.265l27.032 16.166c1.06.53 2.385.53 3.18 0l105.74-61.217c1.06-.53 1.59-1.59 1.59-2.915V83.08c0-1.325-.53-2.385-1.59-2.915l-105.74-60.953c-1.06-.53-2.385-.53-3.18 0L20.405 80.166c-1.06.53-1.59 1.855-1.59 2.915v122.17c0 1.06.53 2.385 1.59 2.915l28.887 16.695c15.636 7.95 25.44-1.325 25.44-10.6V93.68c0-1.59 1.326-3.18 3.181-3.18h13.516c1.59 0 3.18 1.325 3.18 3.18v120.58c0 20.936-11.396 33.126-31.272 33.126-6.095 0-10.865 0-24.38-6.625l-27.827-15.9C4.24 220.885 0 213.465 0 205.515V83.346C0 75.396 4.24 67.976 11.13 64L116.87 2.783c6.625-3.71 15.635-3.71 22.26 0L244.87 64C251.76 67.975 256 75.395 256 83.346v122.17c0 7.95-4.24 15.37-11.13 19.345L139.13 286.08c-3.445 1.59-7.42 2.385-11.13 2.385zm32.596-84.009c-46.377 0-55.917-21.2-55.917-39.221 0-1.59 1.325-3.18 3.18-3.18h13.78c1.59 0 2.916 1.06 2.916 2.65 2.12 14.045 8.215 20.936 36.306 20.936 22.261 0 31.802-5.035 31.802-16.96 0-6.891-2.65-11.926-37.367-15.372-28.886-2.915-46.907-9.275-46.907-32.33 0-21.467 18.02-34.187 48.232-34.187 33.921 0 50.617 11.66 52.737 37.101 0 .795-.265 1.59-.795 2.385-.53.53-1.325 1.06-2.12 1.06h-13.78c-1.326 0-2.65-1.06-2.916-2.385-3.18-14.575-11.395-19.345-33.126-19.345-24.38 0-27.296 8.48-27.296 14.84 0 7.686 3.445 10.07 36.306 14.31 32.597 4.24 47.967 10.336 47.967 33.127-.265 23.321-19.345 36.571-53.002 36.571z"
                    fill="#539E43"
                />
            </svg>
        ),
    },
    {
        name: "Bun",
        logo: (
            <svg className="size-10" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="128" fill="#FBF0DF" />
                <path d="M128 32c-53.02 0-96 42.98-96 96s42.98 96 96 96 96-42.98 96-96-42.98-96-96-96z" fill="#F472B6" />
            </svg>
        ),
    },
    {
        name: "Deno",
        logo: (
            <svg className="size-10" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="128" fill="#000" />
                <path
                    d="M128 256C57.308 256 0 198.692 0 128 0 57.308 57.308 0 128 0c70.692 0 128 57.308 128 128 0 70.692-57.308 128-128 128zm0-245.333C63.467 10.667 10.667 63.467 10.667 128S63.467 245.333 128 245.333 245.333 192.533 245.333 128 192.533 10.667 128 10.667z"
                    fill="#fff"
                />
                <circle cx="128" cy="128" r="85.333" fill="#fff" />
            </svg>
        ),
    },
    {
        name: "Cloudflare Workers",
        logo: (
            <svg className="size-10" viewBox="0 0 256 256" fill="none">
                <path d="M128 0L0 128l128 128 128-128L128 0z" fill="#F38020" />
            </svg>
        ),
    },
    {
        name: "Vercel Edge",
        logo: (
            <svg className="size-10" viewBox="0 0 256 256" fill="none">
                <path d="M128 0L256 256H0L128 0z" fill="#fff" />
            </svg>
        ),
    },
]

export const RuntimeSupport = () => {
    return (
        <section className="px-6 border-t border-white/10 bg-gradient-to-b from-transparent to-purple-950/10">
            <div className="max-w-6xl py-20 px-6 mx-auto border-x border-white/20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">Runtime Support</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Deploy anywhere. Aura Auth runs on multiple JavaScript runtimes, from traditional servers to modern edge
                        environments
                    </p>
                </div>
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-12">
                    {runtimes.map((runtime) => (
                        <div
                            key={runtime.name}
                            className="flex flex-col items-center justify-center p-6 border border-white/10 bg-black transition-all duration-300"
                        >
                            <div className="mb-3">{runtime.logo}</div>
                            <p className="text-sm text-white/90 font-medium text-center">{runtime.name}</p>
                        </div>
                    ))}
                </div>
                <div className="max-w-3xl mx-auto">
                    <div className="p-8 border border-white/20 bg-black/5">
                        <h3 className="text-2xl font-bold text-white mb-6">Built on Web Standards</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Check className="size-6 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/80">
                                    Uses standard <code className="px-2 py-1 rounded bg-white/10 text-purple-400">Request</code>{" "}
                                    and <code className="px-2 py-1 rounded bg-white/10 text-purple-400">Response</code> objects
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="size-6 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/80">
                                    Compatible with any runtime supporting Web Request/Response APIs
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="size-6 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/80">
                                    Deploy to edge runtimes, serverless functions, or traditional servers
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="size-6 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/80">Future-proof your authentication layer</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
