import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github"],
})

const {
    handlers: { GET, POST },
} = auth

export { GET, POST }
