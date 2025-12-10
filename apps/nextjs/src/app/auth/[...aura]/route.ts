import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github", "bitbucket"],
})

const {
    handlers: { GET, POST },
} = auth

export { GET, POST }
