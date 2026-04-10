import { createAuth } from "@aura-stack/hono"

export const auth = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
})

export const { jose, api, toHandler, withAuth } = auth
