import { SessionConfig, SessionStrategy } from "@/@types/session.ts"
import { createJWTStrategy } from "./jwt-strategy.ts"
import { CookieStoreConfig, JoseInstance } from "@/@types/index.ts"

export const createSessionStrategy = (config: SessionConfig, jose: JoseInstance, cookies: CookieStoreConfig): SessionStrategy => {
    const strategy = config.strategy ?? "jwt"

    switch (strategy) {
        case "jwt":
            return createJWTStrategy({
                config,
                jose,
                cookies,
            })
        default:
            throw new Error(`[auth] unknown session strategy "${strategy}". ` + `Valid options are: "jwt", "database", "hybrid".`)
    }
}
