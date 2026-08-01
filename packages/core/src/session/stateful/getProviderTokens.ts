import { AuraAuthError } from "@/shared/errors.ts"
import { handleApiError } from "@/shared/utils/api.ts"
import { getErrorName, shouldRefresh } from "@/shared/utils.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import type { GetProviderTokensStatefulReturn, InternalStatefulContext } from "@/@types/index.ts"

export const getProviderTokens = ({ ctx, cookieManager }: InternalStatefulContext) => {
    const { oauth, logger, sessionConfig } = ctx

    return async (oauthId: string, request: Request): Promise<GetProviderTokensStatefulReturn> => {
        const provider = oauth[oauthId]
        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getProviderTokens",
                oauth_id: oauthId,
            },
        })

        try {
            const { sessionToken } = cookieManager.getCookie(new Headers(request.headers))
            if (!sessionToken) {
                logger?.log("STATEFUL_GET_PROVIDER_TOKENS_NO_SESSION", {
                    structuredData: {
                        reason: "no_session_token",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "SESSION_NOT_FOUND" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: cookieManager.clear(), statusCode }
            }

            const sessionByToken = await sessionConfig.adapter.getSessionByToken(sessionToken)
            if (!sessionByToken || !sessionByToken.user) {
                logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SESSION_INVALID", {
                    structuredData: {
                        reason: "session_not_found_or_no_user",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "SESSION_NOT_FOUND" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: cookieManager.clear(), statusCode }
            }

            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await sessionConfig.adapter.revokeSession(sessionByToken.id, "user_logout")
                }
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "SESSION_NOT_FOUND" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: cookieManager.clear(), statusCode }
            }

            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SESSION_FOUND", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    session_id: sessionByToken.id,
                },
            })

            const accounts = await sessionConfig.adapter.getAccountsByUserId(sessionByToken.userId)
            const getAccount = accounts.find((account) => account.provider === oauthId && account.status === "active")
            const oauthAccount = getAccount ? await sessionConfig.adapter.getOAuthAccount(getAccount?.id ?? "") : null
            if (!oauthAccount) {
                logger?.log("STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_NOT_FOUND", {
                    structuredData: {
                        oauth_id: oauthId,
                        user_id: sessionByToken.userId,
                        reason: "oauth_account_not_found",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "OAUTH_UNLINKED_ACCOUNT_ERROR" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: request.headers, statusCode }
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

                try {
                    const refreshedTokens = await refreshProviderToken(tokens as any, provider)

                    logger?.log("STATEFUL_GET_PROVIDER_TOKENS_REFRESH_SUCCESS", {
                        structuredData: {
                            oauth_id: oauthId,
                            new_expires_at: refreshedTokens.expiresAt,
                        },
                    })

                    await sessionConfig.adapter.updateOAuthTokens(getAccount?.id as string, {
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

                    return { success: true, tokens: refreshedTokens, headers: request.headers }
                } catch (refreshError) {
                    logger?.log("STATEFUL_GET_PROVIDER_TOKENS_REFRESH_ERROR", {
                        structuredData: {
                            oauth_id: oauthId,
                            error_type: getErrorName(refreshError),
                            error_message: refreshError instanceof Error ? refreshError.message : String(refreshError),
                        },
                    })

                    const { code, message, statusCode } = handleApiError(
                        refreshError,
                        "PROVIDER_TOKENS_ERROR",
                        "Failed to get provider tokens"
                    )
                    return { success: false, error: { code, message }, tokens: null, headers: request.headers, statusCode }
                }
            }

            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SUCCESS", {
                structuredData: {
                    oauth_id: oauthId,
                    tokens_returned: true,
                },
            })

            return { success: true, tokens: tokens as any, headers: request.headers }
        } catch (error) {
            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_ERROR", {
                structuredData: {
                    oauth_id: oauthId,
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })

            const { code, message, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")
            return { success: false, error: { code, message }, tokens: null, headers: request.headers, statusCode }
        }
    }
}
