import { createAuth } from "@aura-stack/auth"

export const { handlers, jose } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
})

