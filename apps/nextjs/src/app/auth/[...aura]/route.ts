import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github"],
})

const {
    handlers: { GET },
} = auth

export { GET }
