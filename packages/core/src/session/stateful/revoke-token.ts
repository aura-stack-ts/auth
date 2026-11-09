import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/shared/http/cookie.ts"
import { AuraAuthError, getErrorName } from "@/errors/aura-error.ts"
import { secureApiHeaders, toUnionHeaders } from "@/shared/http/headers.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const revokeToken = (ctx: InternalContextForStateful): SessionStrategy["revokeToken"] => {
    const { logger, session, cookies } = ctx

    return async ({ oauthId, provider, headers, disconnect, sessionByToken }) => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "revokeToken",
                disconnect,
            },
        })

        try {
            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
                }
                logger?.log("AUTH_SESSION_INVALID", {
                    structuredData: {
                        reason: "session_expired_or_inactive",
                    },
                })
                throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
            }

            logger?.log("AUTH_SESSION_VALID", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    session_id: sessionByToken.id,
                },
            })

            const accounts = await session.config.adapter.getAccountsByUserId(sessionByToken.userId)
            const account = accounts.find((account) => account.provider === oauthId)
            if (!account) {
                logger?.log("OAUTH_UNLINKED_ACCOUNT_ERROR", {
                    structuredData: {
                        provider: oauthId,
                        reason: "oauth_account_not_found",
                    },
                })
                throw new AuraAuthError({ code: "OAUTH_UNLINKED_ACCOUNT_ERROR" })
            }

            const oauthAccount = await session.config.adapter.getOAuthAccount(account?.id)
            if (!oauthAccount) {
                logger?.log("OAUTH_UNLINKED_ACCOUNT_ERROR", {
                    structuredData: {
                        provider: oauthId,
                        reason: "oauth_account_not_found",
                    },
                })
                throw new AuraAuthError({ code: "OAUTH_UNLINKED_ACCOUNT_ERROR" })
            }

            if (!disconnect) {
                logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                    structuredData: { provider: oauthId, hasAccessToken: !!oauthAccount.accessToken },
                })

                await revokeProviderToken(provider, oauthAccount.accessToken)

                logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                    structuredData: { provider: oauthId },
                })
            }

            await session.config.adapter.updateAccountStatus(oauthAccount.accountId, "unlinked")

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: {
                    provider: oauthId,
                    account_unlinked: true,
                },
            })

            const cookieName = `${cookies.store.accessToken.name}.${oauthId}`
            const builder = new HeadersBuilder(secureApiHeaders)
                .setCookie(cookieName, "", getExpiredCookie(cookies.store.accessToken.attributes))
                .toHeaders()
            return toUnionHeaders(builder, headers)
        } catch (error) {
            logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: {
                    provider: oauthId,
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            throw error
        }
    }
}
