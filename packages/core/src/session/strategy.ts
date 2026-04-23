import { AuthInvalidConfigurationError } from "@/shared/errors.ts"
import { createStatelessStrategy } from "@/session/stateless.ts"
import type { CreateSessionStrategyOptions, SessionStrategy, User, UserShape } from "@/@types/session.ts"
import { EditableShape, ZodShapeToObject } from "@/@types/utility.ts"

export const createSessionStrategy = <Identity extends EditableShape<UserShape>>({
    config,
    jose,
    cookies,
    logger,
    identity,
}: CreateSessionStrategyOptions<Identity>): SessionStrategy<ZodShapeToObject<Identity> & User> => {
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
