import { AuthInvalidConfigurationError } from "@/shared/errors.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { CreateSessionStrategyOptions, SessionStrategy } from "@/@types/session.ts"
import { UserIdentityType } from "@/shared/identity.ts"

export const createSessionStrategy = <DefaultUser extends UserIdentityType = UserIdentityType>({
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
