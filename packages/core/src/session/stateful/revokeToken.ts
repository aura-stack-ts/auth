import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/cookie.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import { getErrorName, toUnionHeaders } from "@/shared/utils.ts"
import type { InternalStatefulContext } from "@/@types/index.ts"
import { createHash } from "@/shared/crypto.ts"

export const revokeToken = ({ ctx, cookieManager }: InternalStatefulContext) => {
    const { oauth, logger, sessionConfig, cookies } = ctx

    return async (oauthId: string, headers: Headers, disconnect: boolean): Promise<Headers> => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "revokeToken",
                disconnect,
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
                throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
            }

            const tokenHash = await createHash(sessionToken)
            const sessionByToken = await sessionConfig.adapter.getSessionByToken(tokenHash)
            if (!sessionByToken || !sessionByToken.user) {
                logger?.log("AUTH_SESSION_INVALID", {
                    structuredData: {
                        reason: "session_not_found_or_no_user",
                    },
                })
                throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
            }

            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await sessionConfig.adapter.revokeSession(sessionByToken.id, "user_logout")
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

            const accounts = await sessionConfig.adapter.getAccountsByUserId(sessionByToken.userId)
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

            const oauthAccount = await sessionConfig.adapter.getOAuthAccount(account?.id)
            if (!oauthAccount) {
                logger?.log("OAUTH_UNLINKED_ACCOUNT_ERROR", {
                    structuredData: {
                        provider: oauthId,
                        reason: "oauth_account_not_found",
                    },
                })
                throw new AuraAuthError({ code: "OAUTH_UNLINKED_ACCOUNT_ERROR" })
            }

            const provider = oauth?.[oauthId]
            if (!provider) {
                logger?.log("INVALID_OAUTH_CONFIGURATION", {
                    structuredData: {
                        provider: oauthId,
                        reason: "provider_not_configured",
                    },
                })
                throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
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

            await sessionConfig.adapter.updateAccountStatus(oauthAccount.accountId, "unlinked")

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: {
                    provider: oauthId,
                    account_unlinked: true,
                },
            })

            const cookieName = `${cookies.accessToken.name}.${oauthId}`
            const builder = new HeadersBuilder(secureApiHeaders)
                .setCookie(cookieName, "", getExpiredCookie(cookies.accessToken.attributes))
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
