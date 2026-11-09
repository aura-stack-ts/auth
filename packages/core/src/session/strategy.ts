import { AuraAuthError } from "@/errors/aura-error.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"
import { createStatefulStrategy } from "@/session/stateful/index.ts"
import { createStatelessStrategy } from "@/session/stateless/index.ts"
import type { User, FromShapeToObject, Identities } from "@/@types/index.ts"
import type {
    SessionStrategy,
    InternalContextForStateless,
    InternalContextForStateful,
    InternalContext,
} from "@/@types/internal.ts"

export const createSessionStrategy = <Identity extends Identities>(
    ctx: InternalContext<Identity, any>
): SessionStrategy<FromShapeToObject<Identity> & User> => {
    const strategy = ctx.session?.config?.strategy ?? "jwt"

    if (!isStatelessStrategy(ctx.session?.config) && !ctx.session?.config?.adapter) {
        throw new AuraAuthError({ code: "MISSING_ADAPTER_IN_STATEFUL_STRATEGY" })
    }

    switch (strategy) {
        case "jwt":
            return createStatelessStrategy(ctx as InternalContextForStateless)
        case "database":
            return createStatefulStrategy(ctx as InternalContextForStateful)
        default:
            throw new AuraAuthError({ code: "INVALID_SESSION_STRATEGY" })
    }
}
