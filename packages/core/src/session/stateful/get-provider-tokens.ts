import { shouldRefresh } from "@/shared/utils.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const getProviderTokens = (ctx: InternalContextForStateful): SessionStrategy["getProviderTokens"] => {
    const { logger, session } = ctx

    return async ({ oauthId, provider, sessionByToken }) => {
        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getProviderTokens",
                oauth_id: oauthId,
            },
        })

        const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
        if (sessionByToken.status !== "active" || isExpired) {
            if (isExpired) {
                await session.config.adapter.revokeSession(sessionByToken.id, "user_logout")
            }
            throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
        }

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SESSION_FOUND", {
            structuredData: {
                user_id: sessionByToken.userId,
                session_id: sessionByToken.id,
            },
        })

        const accounts = await session.config.adapter.getAccountsByUserId(sessionByToken.userId)
        const getAccount = accounts.find((account) => account.provider === oauthId && account.status === "active")
        const oauthAccount = getAccount ? await session.config.adapter.getOAuthAccount(getAccount?.id ?? "") : null
        if (!oauthAccount) {
            throw new AuraAuthError({ code: "OAUTH_ACCOUNT_NOT_FOUND" })
        }

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_FOUND", {
            structuredData: {
                oauth_id: oauthId,
                account_id: oauthAccount.accountId,
            },
        })

        const tokens = {
            accessToken: oauthAccount.accessToken,
            refreshToken: oauthAccount.refreshToken || undefined,
            idToken: oauthAccount.idToken || undefined,
            tokenType: (oauthAccount.tokenType || "Bearer") as "Bearer",
            scopes: oauthAccount.scopes ? oauthAccount.scopes.split(" ") : [],
            expiresAt: oauthAccount.accessTokenExpiresAt ? Math.floor(oauthAccount.accessTokenExpiresAt.getTime() / 1000) : 0,
            refreshTokenExpiresAt: oauthAccount.refreshTokenExpiresAt
                ? Math.floor(oauthAccount.refreshTokenExpiresAt.getTime() / 1000)
                : undefined,
            issuedAt: Math.floor(oauthAccount.updatedAt.getTime() / 1000),
        }

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_TOKENS_EXTRACTED", {
            structuredData: {
                has_access_token: Boolean(tokens.accessToken),
                has_refresh_token: Boolean(tokens.refreshToken),
                expires_at: tokens.expiresAt,
            },
        })

        const refreshWindow = provider.refreshWindow ?? 300
        const needsRefresh = shouldRefresh(tokens as any, refreshWindow)

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_REFRESH_CHECK", {
            structuredData: {
                needs_refresh: needsRefresh,
                refresh_window: refreshWindow,
                expires_at: tokens.expiresAt,
            },
        })

        if (needsRefresh) {
            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_REFRESHING", {
                structuredData: {
                    oauth_id: oauthId,
                    reason: "token_expired_or_in_refresh_window",
                },
            })

            const refreshedTokens = await refreshProviderToken(tokens as any, provider)

            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_REFRESH_SUCCESS", {
                structuredData: {
                    oauth_id: oauthId,
                    new_expires_at: refreshedTokens.expiresAt,
                },
            })

            await session.config.adapter.updateOAuthTokens(getAccount?.id as string, {
                accountId: oauthAccount.accountId,
                accessToken: refreshedTokens.accessToken,
                refreshToken: refreshedTokens.refreshToken,
                idToken: refreshedTokens.idToken,
                tokenType: refreshedTokens.tokenType,
                scopes: refreshedTokens.scopes ? refreshedTokens.scopes.join(" ") : null,
                accessTokenExpiresAt: refreshedTokens.expiresAt ? new Date(refreshedTokens.expiresAt * 1000) : null,
                refreshTokenExpiresAt: refreshedTokens.refreshTokenExpiresAt
                    ? new Date(refreshedTokens.refreshTokenExpiresAt * 1000)
                    : null,
            })

            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_UPDATED", {
                structuredData: {
                    oauth_id: oauthId,
                    account_id: oauthAccount.accountId,
                },
            })

            return { tokens: refreshedTokens, headers: new Headers(secureApiHeaders) }
        }

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SUCCESS", {
            structuredData: {
                oauth_id: oauthId,
            },
        })

        return { tokens: tokens, headers: new Headers(secureApiHeaders) }
    }
}
