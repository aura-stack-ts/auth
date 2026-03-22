import { AuthInvalidConfigurationError } from "@/errors.ts"
import { createStatelessStrategy } from "@/session/strategies/stateless.ts"
import type { CreateSessionStrategyOptions, SessionStrategy } from "@/@types/session.ts"

export const createSessionStrategy = ({ config, jose, cookies, logger }: CreateSessionStrategyOptions): SessionStrategy => {
    const strategy = config?.strategy ?? "jwt"

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy({
                jose,
                config,
                cookies,
                logger,
            })
        default:
            throw new AuthInvalidConfigurationError(`[auth] unknown session strategy "${strategy}". Valid options are: "jwt".`)
    }
}
