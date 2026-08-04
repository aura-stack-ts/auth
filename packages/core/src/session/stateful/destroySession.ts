import { createHash } from "@/shared/crypto.ts"
import { getErrorName, verifyCSRFToken } from "@/shared/utils.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const destroySession = ({ ctx, cookies, cookieManager }: InternalStatefulContext) => {
    const { logger, sessionConfig, jose } = ctx

    return async (headers: Headers, skipCSRFCheck: boolean = false) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "destroySession",
            },
        })

        await verifyCSRFToken({
            headers,
            cookies: cookies(),
            logger,
            jose: jose,
            skipCSRFCheck,
        })

        try {
            const { sessionToken } = cookieManager.getCookie(headers)
            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (sessionToken) {
                const tokenHash = await createHash(sessionToken)
                const sessionByToken = await sessionConfig.adapter.getSessionByToken(tokenHash)
                logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                    structuredData: {
                        session_found: Boolean(sessionByToken),
                        session_id: sessionByToken?.id || "",
                    },
                })

                if (sessionByToken) {
                    await sessionConfig.adapter.revokeSession(sessionByToken.id, "user_logout")
                    logger?.log("STATEFUL_SESSION_REVOKED", {
                        structuredData: {
                            session_id: sessionByToken.id,
                            reason: "user_logout",
                        },
                    })
                } else {
                    logger?.log("STATEFUL_SESSION_NOT_FOUND_FOR_DESTRUCTION", {
                        structuredData: {
                            reason: "session_not_found_in_database",
                        },
                    })
                }
            } else {
                logger?.log("STATEFUL_NO_TOKEN_FOR_DESTRUCTION", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
            }
        } catch (error) {
            logger?.log("STATEFUL_DESTROY_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            throw error
        }

        const clearedHeaders = cookieManager.clear()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS", {
            structuredData: {
                cookies_cleared: true,
            },
        })

        return clearedHeaders
    }
}
