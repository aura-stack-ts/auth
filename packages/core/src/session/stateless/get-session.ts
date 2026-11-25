import { secureApiHeaders } from "@/shared/http/headers.ts"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { isInvalidSlidingThreshold } from "@/shared/assert.ts"
import { toRethrowError } from "@/shared/utils/to-rethrow-error.ts"
import { calcStatelessExpiration } from "@/shared/utils/expires-at.ts"
import { verifyStatelessSessionToken } from "@/shared/utils/verify-session-token.ts"
import type { Session, User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const getSession = <DefaultUser extends User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["getSession"] => {
    const { identity, jose, session } = ctx

    const maxAge = session?.config?.maxAge ?? session?.config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = session?.config?.expirationStrategy ?? session?.config?.jwt?.expirationStrategy ?? "absolute"
    const slidingThreshold = session?.config?.slidingThreshold
    if (isInvalidSlidingThreshold(slidingThreshold)) {
        throw new AuraAuthError({ code: "INVALID_SLIDING_THRESHOLD_CONFIG_VALUE" })
    }

    return async ({ headers: incomingHeaders, cookieStore }) => {
        const headers = new Headers(secureApiHeaders)
        const outHeaders = ctx.cookies.manager.clear(cookieStore)

        const { session: payload } = await verifyStatelessSessionToken({
            headers: incomingHeaders,
            jwt: jose.manager,
            cookies: cookieStore,
            outHeaders,
        })

        try {
            const { exp, iat, mexp } = await identity.schemaRegistry.parseWithJWT(payload)

            const sessionPayload = identity.skipValidation
                ? payload
                : await identity.schemaRegistry.parse(payload, "SESSION_SCHEMA_PARSER_FAILED")
            if (!sessionPayload.sub) {
                throw new AuraAuthError({ code: "SESSION_INVALID", headers: outHeaders })
            }

            const session: Session<DefaultUser> = {
                user: sessionPayload,
                expires: new Date(exp * 1000).toISOString(),
            }

            const calc = calcStatelessExpiration({
                exp,
                maxAge,
                strategy,
                slidingThreshold,
            })
            if (calc.action === "invalid") {
                throw new AuraAuthError({ code: "SESSION_INVALID", headers: outHeaders })
            }
            if (calc.action === "no_change" || calc.action === "touch") {
                return { session, headers }
            }
            const expiresAt = calc.expiresAt
            const issuedAt = strategy === "absolute" ? iat : Math.floor(Date.now() / 1000)
            const newSessionToken = await jose.manager.createToken({
                ...sessionPayload,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp,
            })
            return {
                session: {
                    user: sessionPayload,
                    expires: expiresAt.toISOString(),
                },
                headers: ctx.cookies.manager.setCookie({ sessionToken: newSessionToken, store: cookieStore }),
            }
        } catch (error) {
            toRethrowError(error, { headers: outHeaders })
            throw new AuraAuthError({ code: "SESSION_INVALID", cause: error, headers: outHeaders })
        }
    }
}
