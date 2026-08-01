import { AuraAuthError } from "@/shared/errors.ts"
import { createStatefulStrategy } from "@/session/stateful/index.ts"
import { createStatelessStrategy } from "@/session/stateless/index.ts"
import type {
    SessionStrategy,
    User,
    CreateSessionStrategyOptions,
    FromShapeToObject,
    Identities,
    InternalStatefulContext,
    InternalStatelessContext,
} from "@/@types/index.ts"
import { createCookieManager } from "./cookie-manager.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"

export const createSessionStrategy = <Identity extends Identities>(
    config: CreateSessionStrategyOptions<Identity>
): SessionStrategy<FromShapeToObject<Identity> & User> => {
    const strategy = config?.ctx?.sessionConfig?.strategy ?? "jwt"
    const cookieManager = createCookieManager(config.cookies)
    const ctx = { ...config, cookieManager }

    if (!isStatelessStrategy(config?.ctx?.sessionConfig) && !config?.ctx?.sessionConfig?.adapter) {
        throw new AuraAuthError({ code: "MISSING_ADAPTER_IN_STATEFUL_STRATEGY" })
    }

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy(ctx as InternalStatelessContext)
        case "database":
            return createStatefulStrategy(ctx as InternalStatefulContext)
        default:
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
