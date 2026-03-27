import { AuthInvalidConfigurationError } from "@/shared/errors.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { CreateSessionStrategyOptions, SessionStrategy, User } from "@/@types/session.ts"

export const createSessionStrategy = <DefaultUser extends User = User>({
    config,
    jose,
    cookies,
    logger,
    identity,
}: CreateSessionStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const strategy = config?.strategy ?? "jwt"

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy({
                jose,
                config,
                cookies,
                logger,
                identity,
            })
        default:
            throw new AuthInvalidConfigurationError(`[auth] unknown session strategy "${strategy}". Valid options are: "jwt".`)
    }
}
