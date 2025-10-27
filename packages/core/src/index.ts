import "dotenv/config"
import { createRouter, type RouterConfig } from "@aura-stack/router"
import { signInAction, callbackAction, sessionAction } from "@/actions/index.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import type { AuthConfig } from "@/@types/index.js"

const routerConfig: RouterConfig = {
    basePath: "/auth",
}

export const createAuth = (authConfig?: AuthConfig) => {
    const oauth = createOAuthIntegrations(authConfig?.oauth)
    const router = createRouter([signInAction({ oauth }), callbackAction({ oauth }), sessionAction], routerConfig)
    return {
        handlers: router,
    }
}
