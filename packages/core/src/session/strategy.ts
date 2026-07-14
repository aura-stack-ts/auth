import { AuraAuthError } from "@/shared/errors.ts"
import { createStatefulStrategy } from "@/session/stateful.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { Identities } from "@/identity/index.ts"
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
                config: config as any,
                cookies,
                logger,
                identity,
            })
        case "database":
            return createStatefulStrategy({
                config: config as any,
                jose,
                cookies,
                logger,
                identity,
            })
        default:
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
