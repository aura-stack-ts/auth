import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { isInvalidSlidingThreshold } from "@/shared/assert.ts"
import { toRethrowError } from "@/shared/utils/to-rethrow-error.ts"
import { verifyStatefulSessionToken } from "@/shared/utils/verify-session-token.ts"
import { calcStatefulExpiration, verifyDebounceLastActivity } from "@/shared/utils/expires-at.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const getSession = <DefaultUser extends User>(
    ctx: InternalContextForStateful
): SessionStrategy<DefaultUser>["getSession"] => {
    const { logger, session: sessionConfig } = ctx
    const maxAge = sessionConfig.config?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = sessionConfig.config?.expirationStrategy ?? "absolute"
    const slidingThreshold = sessionConfig.config?.slidingThreshold
    const touchThreshold = sessionConfig.config?.database?.touchInterval ?? 5 * 60 * 1000
    if (isInvalidSlidingThreshold(slidingThreshold)) {
        throw new AuraAuthError({ code: "INVALID_SLIDING_THRESHOLD_CONFIG_VALUE" })
    }

    return async ({ headers, cookieStore }) => {
        logger?.log("STATEFUL_GET_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getSession",
            },
        })
        const outHeaders = ctx.cookies.manager.clear(cookieStore)
        try {
            const { session, sessionToken } = await verifyStatefulSessionToken({
                headers,
                context: { ctx },
                cookies: cookieStore,
            })

            const { attributes, ...userPayload } = session.user
            const user = { ...userPayload, ...attributes, sub: session.user.id }

            const parsedUser = ctx.identity.skipValidation
                ? user
                : await ctx.identity.schemaRegistry.parse(user, "SESSION_SCHEMA_PARSER_FAILED")

            const now = Date.now()
            let effectiveExpiresAt = session.expiresAt
            const calc = calcStatefulExpiration({
                now,
                maxAge,
                strategy,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                maxDuration: sessionConfig.config.maxDuration,
                slidingThreshold,
            })
            if (calc.action === "extend") {
                await sessionConfig.config.adapter.updateSession(session.id, {
                    expiresAt: calc.expiresAt,
                    lastActivityAt: new Date(),
                })
                effectiveExpiresAt = calc.expiresAt
            }
            if (calc.action === "touch") {
                const lastActivityAt = session.lastActivityAt.getTime()
                if (verifyDebounceLastActivity(now, lastActivityAt, touchThreshold)) {
                    await sessionConfig.config.adapter.touchSession(session.id, new Date(now))
                }
            }
            return {
                session: {
                    user: parsedUser as DefaultUser,
                    expires: effectiveExpiresAt.toISOString(),
                },
                headers: ctx.cookies.manager.setCookie({ sessionToken, store: cookieStore }),
            }
        } catch (error) {
            toRethrowError(error, { headers: outHeaders })
            throw new AuraAuthError({ code: "SESSION_INVALID", headers: outHeaders, cause: error })
        }
    }
}
