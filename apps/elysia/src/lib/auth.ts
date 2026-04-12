import { createAuth } from "@aura-stack/elysia"

export const auth = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
})

export const { api, jose, handlers, toHandler, withAuth } = auth
