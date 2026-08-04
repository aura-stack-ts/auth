import { getErrorName } from "@/shared/utils.ts"
import { createHash } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { isInvalidSlidingThreshold } from "@/shared/assert.ts"
import { calcStatefulExpiration, verifyDebounceLastActivity } from "@/shared/utils/session-strategy.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"
import type { GetStatefulSessionReturn, User } from "@/@types/index.ts"

export const getSession = <DefaultUser extends User>({ ctx, cookieManager }: InternalStatefulContext) => {
    const { logger, sessionConfig } = ctx
    const maxAge = sessionConfig?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = sessionConfig?.expirationStrategy ?? "absolute"
    const slidingThreshold = sessionConfig?.slidingThreshold
    const touchThreshold = sessionConfig?.database?.touchInterval ?? 5 * 60 * 1000
    if (isInvalidSlidingThreshold(slidingThreshold)) {
        throw new AuraAuthError({ code: "INVALID_SLIDING_THRESHOLD_CONFIG_VALUE" })
    }

    return async (headers: Headers): Promise<GetStatefulSessionReturn<DefaultUser>> => {
        logger?.log("STATEFUL_GET_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getSession",
            },
        })

        try {
            const { sessionToken } = cookieManager.getCookie(headers)

            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (!sessionToken) {
                logger?.log("STATEFUL_SESSION_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
                return {
                    session: null,
                    headers: new Headers(secureApiHeaders),
                }
            }

            const tokenHash = await createHash(sessionToken)
            const session = await sessionConfig.adapter.getSessionByToken(tokenHash)
            logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                structuredData: {
                    session_found: Boolean(session),
                    session_id: session?.id || "",
                    user_id: session?.userId || "",
                },
            })

            if (!session) {
                logger?.log("STATEFUL_SESSION_NOT_FOUND", {
                    structuredData: {
                        reason: "session_not_found_in_database",
                    },
                })
                throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" })
            }

            if (!session.user) {
                logger?.log("STATEFUL_SESSION_NO_USER", {
                    structuredData: {
                        reason: "session_has_no_associated_user",
                        session_id: session.id,
                    },
                })
                throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" })
            }

            logger?.log("STATEFUL_SESSION_STATUS_CHECK", {
                structuredData: {
                    session_id: session.id,
                    status: session.status,
                    expires_at: session.expiresAt.toISOString(),
                    is_expired: new Date() > session.expiresAt,
                },
            })

            if (session.status !== "active") {
                logger?.log("STATEFUL_SESSION_INACTIVE", {
                    structuredData: {
                        session_id: session.id,
                        status: session.status,
                    },
                })
                return {
                    session: null,
                    headers: cookieManager.clear(),
                }
            }

            if (new Date() > session.expiresAt) {
                logger?.log("STATEFUL_SESSION_EXPIRED", {
                    structuredData: {
                        session_id: session.id,
                        expires_at: session.expiresAt.toISOString(),
                    },
                })
                await sessionConfig.adapter.revokeSession(session.id, "user_logout")

                return {
                    session: null,
                    headers: cookieManager.clear(),
                }
            }

            const { attributes, ...userPayload } = session.user
            const user = { ...userPayload, ...attributes, sub: session.user.id }
            logger?.log("STATEFUL_USER_DATA_MERGED", {
                structuredData: {
                    user_id: user.id,
                    has_attributes: Boolean(session.user.attributes) || false,
                },
            })

            const parsedUser = ctx.identity.skipValidation ? user : await ctx.identity.schemaRegistry.parse(user)
            logger?.log("STATEFUL_USER_VALIDATION", {
                structuredData: {
                    validation_skipped: ctx.identity.skipValidation || false,
                    user_id: user.id,
                },
            })

            logger?.log("STATEFUL_GET_SESSION_SUCCESS", {
                structuredData: {
                    session_id: session.id,
                    user_id: user.id,
                    expires_at: session.expiresAt.toISOString(),
                },
            })

            const now = Date.now()
            let effectiveExpiresAt = session.expiresAt
            const calc = calcStatefulExpiration({
                now,
                maxAge,
                strategy,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                maxDuration: sessionConfig.maxDuration,
                slidingThreshold,
            })
            if (calc.action === "extend") {
                await sessionConfig.adapter.updateSession(session.id, {
                    expiresAt: calc.expiresAt,
                    lastActivityAt: new Date(),
                })
                effectiveExpiresAt = calc.expiresAt
            }
            if (calc.action === "touch") {
                const lastActivityAt = session.lastActivityAt.getTime()
                if (verifyDebounceLastActivity(now, lastActivityAt, touchThreshold)) {
                    await sessionConfig.adapter.touchSession(session.id, new Date(now))
                }
            }
            return {
                session: {
                    user: parsedUser as DefaultUser,
                    expires: effectiveExpiresAt.toISOString(),
                },
                headers: cookieManager.setCookie({ sessionToken }),
            }
        } catch (error) {
            logger?.log("STATEFUL_GET_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            return {
                session: null,
                headers: cookieManager.clear(),
            }
        }
    }
}
