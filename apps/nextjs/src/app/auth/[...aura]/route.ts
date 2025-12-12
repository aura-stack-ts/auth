import { createAuth } from "@aura-stack/auth"
import { integrations } from "@aura-stack/auth/oauth/index"

const oauth = Object.keys(integrations) as Array<keyof typeof integrations>

const auth = createAuth({
    oauth,
})

const {
    handlers: { GET, POST },
} = auth

export { GET, POST }
