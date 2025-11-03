import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github"],
})

const { handlers } = auth

export { handlers as GET }
