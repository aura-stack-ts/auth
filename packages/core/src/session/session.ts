import { createJWTStrategy } from "@/session/strategies/stateless.ts"
import type { CreateSessionStrategyOptions, SessionStrategy } from "@/@types/session.ts"

export const createSessionStrategy = ({ config, jose, cookies, logger }: CreateSessionStrategyOptions): SessionStrategy => {
    const strategy = config?.strategy ?? "jwt"

    switch (strategy) {
        case "jwt":
            return createJWTStrategy({
                jose,
                config,
                cookies,
                logger,
            })
        default:
            throw new Error(`[auth] unknown session strategy "${strategy}". ` + `Valid options are: "jwt", "database", "hybrid".`)
    }
}
