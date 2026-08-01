import { HeadersBuilder } from "@aura-stack/router"
import { getCookie } from "@/cookie.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { handleApiError } from "@/shared/utils/api.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import { getErrorName, shouldRefresh } from "@/shared/utils.ts"
import type { GetProviderTokensStatefulReturn, InternalStatelessContext } from "@/@types/index.ts"

export const getProviderTokens = ({ ctx, cookies }: InternalStatelessContext) => {
    const { oauth, logger, identity, jwtManager: jwt } = ctx

    return async (oauthId: string, request: Request): Promise<GetProviderTokensStatefulReturn> => {
        logger?.log("STATELESS_GET_PROVIDER_TOKENS_START", {
            structuredData: {
                strategy: "stateless",
                operation: "getProviderTokens",
                oauth_id: oauthId,
            },
        })

        try {
            const provider = oauth[oauthId]
            if (!provider) {
                logger?.log("STATELESS_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND", {
                    structuredData: {
                        oauth_id: oauthId,
                        reason: "provider_not_configured",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: request.headers, statusCode }
            }

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_PROVIDER_FOUND", {
                structuredData: {
                    oauth_id: oauthId,
                },
            })

            const cookieName = `${cookies().accessToken.name}.${oauthId}`
            const cookie = getCookie(request, cookieName)

            if (!cookie) {
                logger?.log("STATELESS_GET_PROVIDER_TOKENS_NO_COOKIE", {
                    structuredData: {
                        oauth_id: oauthId,
                        cookie_name: cookieName,
                        reason: "no_access_token_cookie",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "COOKIE_INVALID_VALUE" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: request.headers, statusCode }
            }

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_COOKIE_FOUND", {
                structuredData: {
                    oauth_id: oauthId,
                    cookie_name: cookieName,
                },
            })

            const decodedToken = await jwt.verifyToken(cookie)
            const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_TOKENS_DECODED", {
                structuredData: {
                    oauth_id: oauthId,
                    has_access_token: Boolean(tokens.accessToken),
                    has_refresh_token: Boolean(tokens.refreshToken),
                    expires_at: tokens.expiresAt,
                },
            })

            const refreshWindow = provider.refreshWindow ?? 300
            const needsRefresh = shouldRefresh(tokens, refreshWindow)

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESH_CHECK", {
                structuredData: {
                    oauth_id: oauthId,
                    needs_refresh: needsRefresh,
                    refresh_window: refreshWindow,
                    expires_at: tokens.expiresAt,
                },
            })

            if (needsRefresh) {
                logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESHING", {
                    structuredData: {
                        oauth_id: oauthId,
                        reason: "token_expired_or_in_refresh_window",
                    },
                })

                try {
                    const refreshedTokens = await refreshProviderToken(tokens, provider!)

                    logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESH_SUCCESS", {
                        structuredData: {
                            oauth_id: oauthId,
                            new_expires_at: refreshedTokens.expiresAt,
                        },
                    })

                    const encodedTokens = await jwt.createToken(refreshedTokens as any)
                    const builder = new HeadersBuilder(secureApiHeaders)
                        .setCookie(cookieName, encodedTokens, cookies().accessToken.attributes)
                        .toHeaders()

                    logger?.log("STATELESS_GET_PROVIDER_TOKENS_COOKIE_UPDATED", {
                        structuredData: {
                            oauth_id: oauthId,
                            cookie_name: cookieName,
                        },
                    })

                    return {
                        success: true,
                        tokens: refreshedTokens,
                        headers: builder,
                    }
                } catch (refreshError) {
                    logger?.log("STATELESS_GET_PROVIDER_TOKENS_REFRESH_ERROR", {
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

            logger?.log("STATELESS_GET_PROVIDER_TOKENS_SUCCESS", {
                structuredData: {
                    oauth_id: oauthId,
                    tokens_returned: true,
                },
            })

            return {
                success: true,
                tokens,
                headers: request.headers,
            }
        } catch (error) {
            logger?.log("STATELESS_GET_PROVIDER_TOKENS_ERROR", {
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
