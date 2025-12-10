import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github", "bitbucket", "figma"],
})

const {
    handlers: { GET, POST },
} = auth

export { GET, POST }
