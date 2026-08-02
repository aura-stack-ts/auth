import { getErrorName } from "@/shared/utils.ts"
import type { InternalStatefulContext } from "@/@types/index.ts"
import { createHash } from "@/shared/crypto.ts"

export const isProviderConnected = ({ ctx, cookieManager }: InternalStatefulContext) => {
    const { logger, sessionConfig } = ctx

    return async (oauthId: string, headers: Headers): Promise<boolean> => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "isProviderConnected",
            },
        })

        try {
            const { sessionToken } = cookieManager.getCookie(headers)
            if (!sessionToken) {
                logger?.log("SESSION_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token",
                    },
                })
                return false
            }

            const tokenHash = await createHash(sessionToken)
            const sessionByToken = await sessionConfig.adapter.getSessionByToken(tokenHash)
            if (!sessionByToken || !sessionByToken.user) {
                logger?.log("AUTH_SESSION_INVALID", {
                    structuredData: {
                        reason: "session_not_found_or_no_user",
                    },
                })
                return false
            }

            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await sessionConfig.adapter.revokeSession(sessionByToken.id, "account_suspended")
                }
                logger?.log("AUTH_SESSION_INVALID", {
                    structuredData: {
                        reason: "session_expired_or_inactive",
                    },
                })
                return false
            }

            logger?.log("AUTH_SESSION_VALID", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    session_id: sessionByToken.id,
                },
            })

            const accounts = await sessionConfig.adapter.getAccountsByUserId(sessionByToken.userId)
            const account = accounts.find((acc) => acc.provider === oauthId)

            if (!account) {
                logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                    structuredData: {
                        provider: oauthId,
                        reason: "account_not_found_for_user",
                    },
                })
                return false
            }

            const isConnected = account.status === "active"
            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: {
                    provider: oauthId,
                    connected: isConnected,
                },
            })

            return isConnected
        } catch (error) {
            /**
             * @todo returns the error to the user in a structured way.
             */
            logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: {
                    provider: oauthId,
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            return false
        }
    }
}
