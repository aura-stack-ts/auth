import { AuraAuthError } from "@/shared/errors.ts"
import { createStatefulStrategy } from "@/session/stateful/index.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { Identities } from "@/identity/index.ts"
import type { FromShapeToObject } from "@/@types/utility.ts"
import type { CreateSessionStrategyOptions, SessionStrategy, User } from "@/@types/session.ts"

export const createSessionStrategy = <Identity extends Identities>({
    ctx,
    config,
    jose,
    cookies,
    logger,
    identity,
    oauth,
}: CreateSessionStrategyOptions<Identity>): SessionStrategy<FromShapeToObject<Identity> & User> => {
    const strategy = config?.strategy ?? "jwt"

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy({
                ctx,
                jose,
                config: config as any,
                cookies,
                logger,
                identity,
                oauth,
            })
        case "database":
            return createStatefulStrategy({
                ctx,
                jose,
                config: config as any,
                cookies,
                logger,
                identity,
                oauth,
            })
        default:
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
