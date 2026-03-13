import { createAuthClient } from "@aura-stack/auth";

export const client = createAuthClient({
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",
})