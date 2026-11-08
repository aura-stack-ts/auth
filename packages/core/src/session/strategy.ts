import { AuraAuthError } from "@/errors/aura-error.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"
import { createStatefulStrategy } from "@/session/stateful/index.ts"
import { createStatelessStrategy } from "@/session/stateless/index.ts"
import type { User, FromShapeToObject, Identities } from "@/@types/index.ts"
import type {
    SessionStrategy,
    CreateSessionStrategyOptions,
    InternalStatefulContext,
    InternalStatelessContext,
} from "@/@types/internal.ts"

export const createSessionStrategy = <Identity extends Identities>(
    config: CreateSessionStrategyOptions<Identity>
): SessionStrategy<FromShapeToObject<Identity> & User> => {
    const strategy = config?.ctx?.session?.config?.strategy ?? "jwt"

    if (!isStatelessStrategy(config?.ctx?.session?.config) && !config?.ctx?.session?.config?.adapter) {
        throw new AuraAuthError({ code: "MISSING_ADAPTER_IN_STATEFUL_STRATEGY" })
    }

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy(config as InternalStatelessContext)
        case "database":
            return createStatefulStrategy(config as InternalStatefulContext)
        default:
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
