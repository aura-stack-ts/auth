import { createAuth } from "@aura-stack/auth"

export const {
    handlers: { GET },
} = createAuth({
    oauth: ["github"],
})
