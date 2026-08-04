import type { TypedJWTPayload } from "@aura-stack/jose"
import type { User } from "@/@types/index.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const createSession = <DefaultUser extends User>({ ctx }: InternalStatelessContext) => {
    const { logger, identity, jwtManager } = ctx
    return async (session: TypedJWTPayload<DefaultUser>) => {
        if (identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }
        const payload = identity.skipValidation ? session : await identity.schemaRegistry.parse(session)
        return jwtManager.createToken(payload as unknown as DefaultUser)
    }
}
