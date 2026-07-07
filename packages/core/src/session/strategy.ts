import { AuraAuthError } from "@/shared/errors.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { Identities } from "@/shared/identity/index.ts"
import type { FromShapeToObject } from "@/@types/utility.ts"
import type { CreateSessionStrategyOptions, SessionStrategy, User } from "@/@types/session.ts"

export const createSessionStrategy = <Identity extends Identities>({
    config,
    jose,
    cookies,
    logger,
    identity,
}: CreateSessionStrategyOptions<Identity>): SessionStrategy<FromShapeToObject<Identity> & User> => {
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
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
