import { getErrorName } from "@/shared/errors/aura-error.ts"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { isInvalidSlidingThreshold } from "@/shared/assert.ts"
import { calcStatelessExpiration } from "@/shared/utils/expires-at.ts"
import type { Session, User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const getSession = <DefaultUser extends User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["getSession"] => {
    const { logger, identity, jose, session } = ctx

    const maxAge = session?.config?.maxAge ?? session?.config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = session?.config?.expirationStrategy ?? session?.config?.jwt?.expirationStrategy ?? "absolute"
    const slidingThreshold = session?.config?.slidingThreshold
    if (isInvalidSlidingThreshold(slidingThreshold)) {
        throw new AuraAuthError({ code: "INVALID_SLIDING_THRESHOLD_CONFIG_VALUE" })
    }

    return async ({ headers: incomingHeaders, cookieStore }) => {
        const headers = new Headers(secureApiHeaders)
        try {
            const { sessionToken } = ctx.cookies.manager.getCookie(incomingHeaders, cookieStore)
            if (!sessionToken) return { session: null, headers }

            const payload = await jose.manager.verifyToken(sessionToken)
            const { exp, iat, mexp } = await identity.schemaRegistry.parseWithJWT(payload)

            const sessionPayload = identity.skipValidation ? payload : await identity.schemaRegistry.parse(payload)
            if (!sessionPayload.sub) return { session: null, headers }

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
                return { session: null, headers }
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
            logger?.log("SESSION_REFRESHED", { structuredData: { strategy: "stateless", expiresAt: expiresAt.toISOString() } })
            return {
                session: {
                    user: sessionPayload,
                    expires: expiresAt.toISOString(),
                },
                headers: ctx.cookies.manager.setCookie({ sessionToken: newSessionToken, store: cookieStore }),
            }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: ctx.cookies.manager.clearAll(cookieStore) }
        }
    }
}
