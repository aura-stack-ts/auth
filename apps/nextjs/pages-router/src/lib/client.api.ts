import { createClient } from "@aura-stack/auth"

export const client = createClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    basePath: "/api/auth",
    cache: "no-store",
    credentials: "include",
})
