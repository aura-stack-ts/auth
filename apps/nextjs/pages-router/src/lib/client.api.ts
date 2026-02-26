import { createClient } from "@aura-stack/auth"

export const client = createClient({
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",
    cache: "no-store",
    credentials: "include",
})
