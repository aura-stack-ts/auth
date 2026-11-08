import { getErrorName } from "@/errors/aura-error.ts"
import type { InternalStatefulContext, SessionStrategy } from "@/@types/internal.ts"

export const isProviderConnected = ({ ctx }: InternalStatefulContext): SessionStrategy["isProviderConnected"] => {
    const { logger, session } = ctx

    return async ({ oauthId, sessionByToken }) => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "isProviderConnected",
            },
        })
        try {
            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await session.config.adapter.revokeSession(sessionByToken.id, "account_suspended")
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

            const accounts = await session.config.adapter.getAccountsByUserId(sessionByToken.userId)
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
