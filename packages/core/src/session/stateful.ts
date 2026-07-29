import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { verifyCSRFToken, getErrorName, shouldRefresh, toUnionHeaders } from "@/shared/utils.ts"
import { handleApiError } from "@/shared/utils/api.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { createHash, createSecretValue, createCSRF } from "@/shared/crypto.ts"
import type { JoseInstance } from "@/@types/index.ts"
import type { DeepPartial } from "@/@types/utility.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type {
    DatabaseStrategyOptions,
    GetStatefulSessionReturn,
    GetProviderTokensStatefulReturn,
    Session,
    SessionStrategy,
    User,
} from "@/@types/session.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/cookie.ts"
import {
    createAuthorizationURL,
    createRedirectTo,
    createRedirectURI,
    getOriginURL,
    getTrustedOrigins,
} from "@/shared/utils/authorization.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createOIDCAuthorizationURL } from "@/shared/oidc/authorization-url.ts"
import { createAccessToken, getUserInfo } from "@/shared/utils/oauth.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/assert.ts"

export const createStatefulStrategy = <DefaultUser extends User = User>({
    config,
    cookies,
    ctx,
    logger,
    jose,
    oauth,
}: DatabaseStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const cookieConfig = createCookieManager(cookies)

    const getSession = async (headers: Headers): Promise<GetStatefulSessionReturn<DefaultUser>> => {
        logger?.log("STATEFUL_GET_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getSession",
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)

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

            const session = await config.adapter.getSessionByToken(sessionToken)
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
                    headers: new Headers(secureApiHeaders),
                }
            }

            if (new Date() > session.expiresAt) {
                logger?.log("STATEFUL_SESSION_EXPIRED", {
                    structuredData: {
                        session_id: session.id,
                        expires_at: session.expiresAt.toISOString(),
                    },
                })
                await config.adapter.revokeSession(session.id, "user_logout")

                return {
                    session: null,
                    headers: cookieConfig.clear(),
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

            return {
                session: {
                    user: parsedUser as DefaultUser,
                    expires: session.expiresAt.toISOString(),
                },
                headers: cookieConfig.setCookie({ sessionToken }),
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
                headers: cookieConfig.clear(),
            }
        }
    }

    const createSession = async (session: TypedJWTPayload<DefaultUser>) => {
        logger?.log("STATEFUL_CREATE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "createSession",
                user_id: session.sub,
            },
        })

        if (ctx.identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }

        const payload = ctx.identity.skipValidation ? session : await ctx.identity.schemaRegistry.parse(session)
        logger?.log("STATEFUL_PAYLOAD_VALIDATION", {
            structuredData: {
                validation_skipped: ctx.identity.skipValidation || false,
                user_id: payload.sub || "",
                has_email: Boolean(payload.email) || false,
            },
        })

        if (!payload.sub) {
            logger?.log("STATEFUL_CREATE_SESSION_ERROR", {
                structuredData: {
                    error: "missing_user_id",
                    reason: "payload.sub is required",
                },
            })
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        const secretValue = createSecretValue(64)
        logger?.log("STATEFUL_TOKEN_GENERATED", {
            structuredData: {
                token_length: secretValue.length,
            },
        })

        const tokenHash = await createHash(secretValue)
        logger?.log("STATEFUL_TOKEN_HASHED", {
            structuredData: {
                hash_length: tokenHash.length,
            },
        })

        const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 15 * 1000)
        logger?.log("STATEFUL_SESSION_EXPIRATION_SET", {
            structuredData: {
                expires_at: expiresAt?.toISOString(),
                max_age_days: 15,
            },
        })

        const cryptoId = createSecretValue(32)
        const { sub: userId, email, image, name, ...attributes } = payload

        let user = await config.adapter.getUserById(userId as string)
        if (!user) {
            logger?.log("STATEFUL_USER_NOT_FOUND_CREATING", {
                structuredData: {
                    user_id: userId,
                    reason: "user_not_found_creating_new",
                },
            })
            user = await config.adapter.createUser({
                id: userId as string,
                name,
                email,
                image,
                attributes,
            })
            logger?.log("STATEFUL_USER_CREATED", {
                structuredData: {
                    user_id: user.id,
                    email: user.email || "",
                },
            })
        } else {
            logger?.log("STATEFUL_USER_FOUND_UPDATING", {
                structuredData: {
                    user_id: userId,
                    reason: "user_exists_updating",
                },
            })
            user = await config.adapter.updateUser(userId as string, {
                name,
                email,
                image,
                attributes,
            })
            logger?.log("STATEFUL_USER_UPDATED", {
                structuredData: {
                    user_id: user.id,
                    email: user.email || "",
                },
            })
        }

        const dbSession = await config.adapter.createSession({
            id: cryptoId,
            userId: userId as string,
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash,
            expiresAt,
            metadata: null,
        })

        logger?.log("STATEFUL_SESSION_CREATED", {
            structuredData: {
                session_id: dbSession.id,
                user_id: dbSession.userId,
                status: dbSession.status,
                expires_at: dbSession?.expiresAt?.toISOString(),
            },
        })

        logger?.log("STATEFUL_CREATE_SESSION_SUCCESS", {
            structuredData: {
                session_id: dbSession.id,
                user_id: dbSession.userId,
                token_returned: true,
            },
        })

        return secretValue
    }

    const refreshSession = async (
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean = false
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        logger?.log("STATEFUL_REFRESH_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "refreshSession",
                skip_csrf_check: skipCSRFCheck,
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (!sessionToken) {
                logger?.log("STATEFUL_REFRESH_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            logger?.log("STATEFUL_CSRF_VERIFICATION_START", {
                structuredData: {
                    skip_csrf_check: skipCSRFCheck,
                },
            })

            const isValidToken = await verifyCSRFToken({
                headers,
                skipCSRFCheck,
                cookies: cookies(),
                logger,
                jose: jose as JoseInstance,
            })

            logger?.log("STATEFUL_CSRF_VERIFICATION_RESULT", {
                structuredData: {
                    is_valid: isValidToken,
                },
            })

            if (!isValidToken) {
                logger?.log("STATEFUL_CSRF_VERIFICATION_FAILED", {
                    structuredData: {
                        reason: "csrf_token_invalid",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
            logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                structuredData: {
                    session_found: Boolean(sessionByToken),
                    session_id: sessionByToken?.id || "",
                    user_id: sessionByToken?.userId || "",
                },
            })

            if (!sessionByToken || !sessionByToken.user) {
                logger?.log("STATEFUL_REFRESH_SESSION_NOT_FOUND", {
                    structuredData: {
                        reason: "session_not_found_or_no_user",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            if (sessionByToken.status !== "active") {
                return { session: null, headers: cookieConfig.clear() }
            }

            logger?.log("STATEFUL_SESSION_EXPIRATION_CHECK", {
                structuredData: {
                    session_id: sessionByToken.id,
                    expires_at: sessionByToken.expiresAt.toISOString(),
                    is_expired: new Date() > sessionByToken.expiresAt,
                },
            })

            if (new Date() > sessionByToken.expiresAt) {
                logger?.log("STATEFUL_SESSION_EXPIRED", {
                    structuredData: {
                        session_id: sessionByToken.id,
                        expires_at: sessionByToken.expiresAt.toISOString(),
                    },
                })
                await config.adapter.revokeSession(sessionByToken.id, "user_logout")
                logger?.log("STATEFUL_EXPIRED_SESSION_REVOKED", {
                    structuredData: {
                        session_id: sessionByToken.id,
                        reason: "session_expired",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            const { attributes, ...spreadUser } = sessionByToken.user
            const currentUser = { ...spreadUser, ...attributes, sub: sessionByToken.user.id }
            logger?.log("STATEFUL_USER_DATA_MERGED", {
                structuredData: {
                    user_id: currentUser.id,
                    has_attributes: Boolean(attributes),
                },
            })

            const parsedCurrentUser = ctx.identity.skipValidation
                ? currentUser
                : await ctx.identity.schemaRegistry.parse(currentUser)
            logger?.log("STATEFUL_USER_VALIDATION", {
                structuredData: {
                    validation_skipped: ctx.identity.skipValidation || false,
                    user_id: currentUser.id,
                },
            })

            const sessionPayload = ctx.identity.skipValidation
                ? session.user
                : await ctx.identity.schemaRegistry.parseAsPartial(session.user)

            logger?.log("STATEFUL_SESSION_UPDATE_PAYLOAD", {
                structuredData: {
                    has_update_payload: Boolean(sessionPayload),
                    user_id: currentUser.id,
                },
            })

            const updatedUser = {
                ...parsedCurrentUser,
                ...sessionPayload,
                sub: parsedCurrentUser.sub,
            }

            logger?.log("STATEFUL_USER_FIELDS_MERGED", {
                structuredData: {
                    user_id: updatedUser.id,
                    fields_updated: Object.keys(sessionPayload || {}).join(","),
                },
            })

            const validatedUser = ctx.identity.skipValidation ? updatedUser : await ctx.identity.schemaRegistry.parse(updatedUser)
            logger?.log("STATEFUL_UPDATED_USER_VALIDATED", {
                structuredData: {
                    user_id: validatedUser.id,
                    validation_skipped: ctx.identity.skipValidation || false,
                },
            })

            if (sessionPayload && Object.keys(sessionPayload).length > 0) {
                const { sub: _sub, ...userUpdateFields } = validatedUser
                await config.adapter.updateUser(sessionByToken.userId, userUpdateFields as any)
                logger?.log("STATEFUL_USER_UPDATED_IN_DB", {
                    structuredData: {
                        user_id: sessionByToken.userId,
                        fields_updated: Object.keys(userUpdateFields).join(","),
                    },
                })
            }

            const newExpiresAt = new Date(Date.now() + 60 * 60 * 24 * 15 * 1000)
            logger?.log("STATEFUL_SESSION_EXPIRATION_UPDATE", {
                structuredData: {
                    session_id: sessionByToken.id,
                    old_expires_at: sessionByToken.expiresAt.toISOString(),
                    new_expires_at: newExpiresAt.toISOString(),
                },
            })

            await config.adapter.updateSession(sessionByToken.id, {
                id: sessionByToken.id,
                userId: sessionByToken.userId,
                deviceId: sessionByToken.deviceId,
                authenticatedWith: sessionByToken.authenticatedWith,
                status: sessionByToken.status,
                mfaState: sessionByToken.mfaState,
                tokenHash: sessionByToken.tokenHash,
                expiresAt: newExpiresAt,
                metadata: sessionByToken.metadata,
            })

            logger?.log("STATEFUL_SESSION_UPDATED", {
                structuredData: {
                    session_id: sessionByToken.id,
                    new_expires_at: newExpiresAt.toISOString(),
                },
            })

            await config.adapter.touchSession(sessionByToken.id, new Date())
            logger?.log("STATEFUL_SESSION_TOUCHED", {
                structuredData: {
                    session_id: sessionByToken.id,
                    last_activity: new Date().toISOString(),
                },
            })

            const updatedSession: Session<DefaultUser> = {
                user: validatedUser as DefaultUser,
                expires: newExpiresAt.toISOString(),
            }

            logger?.log("STATEFUL_REFRESH_SESSION_SUCCESS", {
                structuredData: {
                    session_id: sessionByToken.id,
                    user_id: sessionByToken.userId,
                    expires_at: newExpiresAt.toISOString(),
                },
            })

            return { session: updatedSession, headers: new Headers(secureApiHeaders) }
        } catch (error) {
            logger?.log("STATEFUL_REFRESH_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            return { session: null, headers: cookieConfig.clear() }
        }
    }

    const revokeSession = async (sessionId: string): Promise<void> => {
        logger?.log("STATEFUL_REVOKE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "revokeSession",
                session_id: sessionId,
            },
        })

        if (!sessionId) {
            logger?.log("STATEFUL_REVOKE_SESSION_ERROR", {
                structuredData: {
                    error: "missing_session_id",
                    reason: "session_id is required",
                },
            })
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        await config.adapter.revokeSession(sessionId, "user_logout")

        logger?.log("STATEFUL_REVOKE_SESSION_SUCCESS", {
            structuredData: {
                session_id: sessionId,
                reason: "user_logout",
            },
        })
    }

    const destroySession = async (headers: Headers, skipCSRFCheck: boolean = false) => {
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
            jose: jose as JoseInstance,
            skipCSRFCheck,
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (sessionToken) {
                const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
                logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                    structuredData: {
                        session_found: Boolean(sessionByToken),
                        session_id: sessionByToken?.id || "",
                    },
                })

                if (sessionByToken) {
                    await config.adapter.revokeSession(sessionByToken.id, "user_logout")
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

        const clearedHeaders = cookieConfig.clear()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS", {
            structuredData: {
                cookies_cleared: true,
            },
        })

        return clearedHeaders
    }

    const getProviderTokens = async (oauthId: string, request: Request): Promise<GetProviderTokensStatefulReturn> => {
        logger?.log("STATEFUL_GET_PROVIDER_TOKENS_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getProviderTokens",
                oauth_id: oauthId,
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(new Headers(request.headers))
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
                return { success: false, error: { code, message }, tokens: null, headers: cookieConfig.clear(), statusCode }
            }

            const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
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
                return { success: false, error: { code, message }, tokens: null, headers: cookieConfig.clear(), statusCode }
            }

            const isExpired = Date.now() > sessionByToken.expiresAt.getTime()
            if (sessionByToken.status !== "active" || isExpired) {
                if (isExpired) {
                    await config.adapter.revokeSession(sessionByToken.id, "user_logout")
                }
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "SESSION_NOT_FOUND" }),
                    "PROVIDER_TOKENS_ERROR",
                    "Failed to get provider tokens"
                )
                return { success: false, error: { code, message }, tokens: null, headers: cookieConfig.clear(), statusCode }
            }

            logger?.log("STATEFUL_GET_PROVIDER_TOKENS_SESSION_FOUND", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    session_id: sessionByToken.id,
                },
            })

            const oauthAccount = await config.adapter.getOAuthAccount(oauthId)
            if (!oauthAccount) {
                logger?.log("STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_NOT_FOUND", {
                    structuredData: {
                        oauth_id: oauthId,
                        user_id: sessionByToken.userId,
                        reason: "oauth_account_not_found",
                    },
                })
                const { code, message, statusCode } = handleApiError(
                    new AuraAuthError({ code: "COOKIE_INVALID_VALUE" }),
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

            const provider = oauth?.[oauthId]
            if (!provider) {
                logger?.log("STATEFUL_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND", {
                    structuredData: {
                        oauth_id: oauthId,
                        reason: "provider_not_configured",
                    },
                })
                return { success: true, tokens: tokens as any, headers: request.headers }
            }

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

                    await config.adapter.updateOAuthTokens(oauthId, {
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

    const revokeToken = async (oauthId: string, headers: Headers, disconnect: boolean): Promise<Headers> => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "revokeToken",
                disconnect,
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) {
                logger?.log("SESSION_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token",
                    },
                })
                throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
            }

            const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
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
                    await config.adapter.revokeSession(sessionByToken.id, "user_logout")
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

            const oauthAccount = await config.adapter.getOAuthAccount(oauthId)
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

            await config.adapter.updateAccountStatus(oauthAccount.accountId, "unlinked")

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: {
                    provider: oauthId,
                    account_unlinked: true,
                },
            })

            const cookieName = `${cookies().accessToken.name}.${oauthId}`
            const builder = new HeadersBuilder(secureApiHeaders)
                .setCookie(cookieName, "", getExpiredCookie(cookies().accessToken.attributes))
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

    const isProviderConnected = async (oauthId: string, headers: Headers): Promise<boolean> => {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: "isProviderConnected",
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) {
                logger?.log("SESSION_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token",
                    },
                })
                return false
            }

            const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
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
                    await config.adapter.revokeSession(sessionByToken.id, "user_logout")
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

            const accounts = await config.adapter.getAccountsByUserId(sessionByToken.userId)
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

    const refreshUserInfo = async (userInfo: TypedJWTPayload<DefaultUser>, headers: Headers, skipCSRFCheck: boolean) => {
        return await refreshSession(headers, { user: userInfo }, skipCSRFCheck)
    }

    const signIn = async (oauthId: string, request: Request, redirectTo?: string) => {
        const provider = oauth[oauthId]

        const redirectURI = await createRedirectURI(request, oauthId, ctx)
        const redirectToValue = await createRedirectTo(request, redirectTo, ctx)

        const isOIDC = isOIDCProvider(provider!)
        logger?.log("SIGN_IN_PROVIDER_TYPE_DETECTED", {
            structuredData: { oauth_provider: oauthId, oidc: isOIDC },
        })

        const resolvedProvider = isOIDC ? await resolveOpenIDProvider(provider!) : provider!

        if (isOIDC) {
            logger?.log("OIDC_PROVIDER_RESOLVED", {
                structuredData: { oauth_provider: oauthId, oidc: isOIDC },
            })
        }

        let authorization: string
        let state: string
        let codeVerifier: string
        let nonce: string | undefined

        if (isOIDC) {
            const result = await createOIDCAuthorizationURL(resolvedProvider, redirectURI, ctx)
            authorization = result.authorization
            state = result.state
            codeVerifier = result.codeVerifier
            nonce = result.nonce
        } else {
            const result = await createAuthorizationURL(resolvedProvider, redirectURI, ctx)
            authorization = result.authorization
            state = result.state
            codeVerifier = result.codeVerifier
        }

        logger?.log("SIGN_IN_INITIATED", {
            structuredData: { oauth_provider: oauthId, oidc: isOIDC },
        })

        // Store OAuth transaction in database
        const userAgent = request.headers.get("user-agent") || null
        const fingerprint = request.headers.get("x-device-fingerprint") || null

        // Extract device ID from headers if available
        const deviceId = request.headers.get("x-device-id") || null

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await config.adapter.createOAuthTransaction({
            id: crypto.randomUUID(),
            provider: oauthId,
            state,
            nonce: nonce || null,
            codeVerifier,
            redirectUri: redirectURI,
            redirectTo: redirectToValue,
            userAgent,
            fingerprint,
            deviceId,
            createdAt: new Date(),
            expiresAt,
            metadata: null,
        })

        return {
            success: true,
            signInURL: authorization,
            headers: new Headers(secureApiHeaders),
        }
    }

    const oauthCallback = async (oauthId: string, request: Request, { code, state }: { code: string; state: string }) => {
        const oauthConfig = oauth[oauthId]
        const isOIDC = isOIDCProvider(oauthConfig)

        // Retrieve OAuth transaction from database
        const transaction = await config.adapter.getOAuthTransactionByState(state)

        if (!transaction) {
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    oauth_provider: oauthId,
                    state,
                },
            })
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_MISMATCHING_STATE",
                    message: "The provided state passed in the OAuth response does not match the stored token state.",
                },
                { status: 400 }
            )
        }

        // Check if transaction has expired
        if (new Date() > transaction.expiresAt) {
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    oauth_provider: oauthId,
                    state,
                    expires_at: transaction.expiresAt.toISOString(),
                },
            })
            await config.adapter.deleteExpiredOAuthTransactions()
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_TRANSACTION_EXPIRED",
                    message: "The OAuth transaction has expired. Please try signing in again.",
                },
                { status: 400 }
            )
        }

        // Validate provider matches
        if (transaction.provider !== oauthId) {
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    expected_provider: transaction.provider,
                    provided_provider: oauthId,
                },
            })
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_PROVIDER_MISMATCH",
                    message: "The OAuth provider does not match the stored transaction.",
                },
                { status: 400 }
            )
        }

        // Consume the transaction (delete it)
        await config.adapter.consumeOAuthTransaction(state)

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(oauthConfig) : oauthConfig

        if (!transaction.codeVerifier) {
            throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" as any })
        }

        const accessToken = await createAccessToken(
            resolvedConfig,
            transaction.redirectUri,
            code,
            transaction.codeVerifier,
            logger
        )

        if (isOIDC) {
            if (!accessToken.id_token) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            const { issuer, jwks_uri } = resolvedConfig.oidc!
            if (!jwks_uri || !transaction.nonce || !resolvedConfig.clientId) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            await validateIDToken(accessToken.id_token as string, {
                issuer,
                clientId: resolvedConfig.clientId,
                nonce: transaction.nonce,
                jwks_uri,
            })
        }

        const origins = await getTrustedOrigins(request, ctx.trustedOrigins)
        const requestOrigin = await getOriginURL(request, ctx)

        if (transaction.redirectTo && !isRelativeURL(transaction.redirectTo)) {
            const isValid =
                origins.length > 0
                    ? isTrustedOrigin(transaction.redirectTo, origins)
                    : isSameOrigin(transaction.redirectTo, requestOrigin)
            if (!isValid) {
                logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED", {
                    structuredData: {
                        redirect_path: transaction.redirectTo,
                        provider: oauthId,
                        has_trusted_origins: origins.length > 0,
                        request_origin: requestOrigin,
                    },
                })
                throw new AuraAuthError({ code: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED" })
            }
        }

        const userInfo = await getUserInfo(resolvedConfig, accessToken, logger)

        // Create or update user and OAuth account in database
        const userEmail = userInfo.email || ""
        const user = await config.adapter.getUserByEmail(userEmail)
        let userId: string

        if (user) {
            userId = user.id
            // Update user with latest info from provider
            const updateData: any = {}
            if (userInfo.name) updateData.name = userInfo.name
            if (userInfo.image) updateData.image = userInfo.image
            await config.adapter.updateUser(userId, updateData)
        } else {
            // Create new user
            const newUser = await config.adapter.createUser({
                id: crypto.randomUUID(),
                email: userInfo.email,
                name: userInfo.name,
                image: userInfo.image,
                emailVerifiedAt: new Date(),
                status: "active",
                mfaEnabled: false,
                mfaPreferredMethod: null,
                attributes: {},
            })
            userId = newUser.id
        }

        // Create or update OAuth account
        const existingAccount = await config.adapter.getAccountByProvider(oauthId, userInfo.sub)
        let accountId: string

        if (existingAccount) {
            accountId = existingAccount.id
            await config.adapter.updateOAuthTokens(accountId, {
                accessToken: accessToken.access_token,
                refreshToken: accessToken.refresh_token || null,
                idToken: accessToken.id_token || null,
                tokenType: accessToken.token_type,
                scopes: Array.isArray(accessToken.scope) ? accessToken.scope.join(" ") : accessToken.scope || null,
                accessTokenExpiresAt: accessToken.expires_in ? new Date(Date.now() + accessToken.expires_in * 1000) : null,
            })
        } else {
            // Create account
            const newAccount = await config.adapter.createAccount({
                id: crypto.randomUUID(),
                userId,
                provider: oauthId,
                providerUserId: userInfo.sub,
                type: "oauth",
                status: "active",
            })
            accountId = newAccount.id

            // Create OAuth account with tokens
            await config.adapter.createOAuthAccount({
                accountId,
                accessToken: accessToken.access_token,
                refreshToken: accessToken.refresh_token || null,
                idToken: accessToken.id_token || null,
                tokenType: accessToken.token_type,
                scopes: Array.isArray(accessToken.scope) ? accessToken.scope.join(" ") : accessToken.scope || null,
                accessTokenExpiresAt: accessToken.expires_in ? new Date(Date.now() + accessToken.expires_in * 1000) : null,
            })
        }

        // Create session
        const sessionPayload: any = {
            sub: userId,
            email: userInfo.email || "",
            name: userInfo.name || "",
            image: userInfo.image || "",
            attributes: {},
        }

        const session = await createSession(sessionPayload)

        // Generate CSRF token
        const csrfToken = await createCSRF(jose as any)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
                user_id: userId,
            },
        })

        // Set session token and CSRF token cookies
        const headersBuilder = new HeadersBuilder()
            .setCookie(cookies().sessionToken.name, session, cookies().sessionToken.attributes)
            .setCookie(cookies().csrfToken.name, csrfToken, cookies().csrfToken.attributes)

        // Redirect to the stored redirect URL or default
        const redirectTo = transaction.redirectTo || "/"

        headersBuilder.setHeader("Location", redirectTo)

        return Response.json({ oauth: oauthId }, { status: 302, headers: headersBuilder.toHeaders() })
    }

    return {
        getSession,
        createSession,
        refreshSession,
        revokeSession,
        revokeToken,
        destroySession,
        getProviderTokens,
        isProviderConnected,
        refreshUserInfo,
        signIn,
        oauthCallback,
    }
}
