import { getCookie, getExpiredCookie, getOptionalCookie } from "@/cookie.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { cacheControl, secureApiHeaders } from "@/shared/headers.ts"
import { handleApiError } from "@/shared/utils/api.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { refreshProviderToken } from "@/shared/utils/refresh-tokens.ts"
import {
    verifyCSRFToken,
    getErrorName,
    verifySessionToken,
    shouldRefresh,
    toUnionHeaders,
    getStandardSession,
    timingSafeEqual,
    transformToTokenPayload,
} from "@/shared/utils.ts"
import type {
    Session,
    SessionStrategy,
    User,
    TypedJWTPayload,
    JWTStrategyOptions,
    GetStatelessSessionReturn,
    DeepPartial,
    JoseInstance,
    GetProviderTokensStatefulReturn,
} from "@/@types/index.ts"
import { revokeProviderToken } from "@/shared/utils/revoke-token.ts"
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
import { createCSRF } from "@/shared/crypto.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>({
    ctx,
    config,
    jose,
    logger,
    cookies,
    identity,
    oauth,
}: JWTStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const jwt = createJoseManager<DefaultUser>(config?.jwt, jose)
    const cookieConfig = createCookieManager(cookies)
    const maxAge = config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = config?.jwt?.expirationStrategy ?? "absolute"

    const updateExpires = ({ exp }: { exp: number | undefined }): Date | null => {
        if (!exp) return null
        const now = Math.floor(Date.now() / 1000)
        switch (strategy) {
            case "fixed":
            case "absolute":
                return null
            case "rolling":
                return new Date((now + maxAge) * 1000)
            case "sliding": {
                const threshold = maxAge * 0.25
                if (exp - now < threshold) {
                    return new Date((now + maxAge) * 1000)
                }
                return null
            }
            default:
                return null
        }
    }

    const getSession = async (headers: Headers): Promise<GetStatelessSessionReturn<DefaultUser>> => {
        const newHeaders = new Headers()
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) return { session: null, headers: newHeaders }

            const claims = await jwt.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)
            const { exp, iat: _iat, mexp: _mexp, ...defaultPayload } = parsedClaims
            const userClaims = await identity.schemaRegistry.parse(defaultPayload)
            if (!userClaims.sub) return { session: null, headers: newHeaders }

            const session: Session<DefaultUser> = {
                user: userClaims as DefaultUser,
                expires: parsedClaims.exp ? new Date(exp * 1000).toISOString() : "",
            }

            const expiresAt = updateExpires({ exp })
            if (!expiresAt) {
                return { session: { expires: session.expires, user: userClaims }, headers }
            }

            const issuedAt = strategy === "absolute" ? parsedClaims.iat : Math.floor(Date.now() / 1000)
            const newSessionToken = await jwt.createToken({
                ...userClaims,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp: parsedClaims.mexp,
            })
            logger?.log("SESSION_REFRESHED", { structuredData: { strategy: "stateless", expiresAt: expiresAt.toISOString() } })
            return {
                session: {
                    user: userClaims,
                    expires: expiresAt.toISOString(),
                } as unknown as Session<DefaultUser>,
                headers: cookieConfig.setCookie({ sessionToken: newSessionToken }),
            }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: newHeaders }
        }
    }

    const createSession = async (session: TypedJWTPayload<DefaultUser>) => {
        if (identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }
        const payload = identity.skipValidation ? session : await identity.schemaRegistry.parse(session)
        return jwt.createToken(payload as unknown as DefaultUser)
    }

    const getProviderTokens = async (oauthId: string, request: Request): Promise<GetProviderTokensStatefulReturn> => {
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
                    const newHeaders = toUnionHeaders(builder, request.headers)

                    logger?.log("STATELESS_GET_PROVIDER_TOKENS_COOKIE_UPDATED", {
                        structuredData: {
                            oauth_id: oauthId,
                            cookie_name: cookieName,
                        },
                    })

                    return {
                        success: true,
                        tokens: refreshedTokens,
                        headers: newHeaders,
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

    const refreshSession = async (
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean = false
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) {
                return { session: null, headers: cookieConfig.clear() }
            }
            const isValidToken = await verifyCSRFToken({
                headers,
                skipCSRFCheck,
                cookies: cookies(),
                logger,
                jose: jose as JoseInstance,
            })
            if (!isValidToken) {
                return { session: null, headers: cookieConfig.clear() }
            }
            const claims = await jwt.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)

            const { exp, mexp, iat } = parsedClaims
            const defaultPayload = identity.skipValidation ? parsedClaims : await identity.schemaRegistry.parse(parsedClaims)
            const { sub } = defaultPayload
            const sessionPayload = identity.skipValidation
                ? session.user
                : await identity.schemaRegistry.parseAsPartial(session.user)

            const expiresAt = session.expires
                ? new Date(Math.min(Date.now() + maxAge * 1000, new Date(session.expires).getTime()))
                : (updateExpires({ exp }) ?? new Date(Date.now() + maxAge * 1000))
            const updatedSession: Session<DefaultUser> = {
                user: {
                    ...defaultPayload,
                    ...sessionPayload,
                    sub,
                } as DefaultUser,
                expires: expiresAt.toISOString(),
            }
            const verifiedPayload = await identity.schemaRegistry.parse(updatedSession.user)
            const issuedAt = strategy === "absolute" ? iat : Math.floor(Date.now() / 1000)
            const newToken = await jwt.createToken({
                ...verifiedPayload,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp,
            })
            updatedSession.expires = new Date(updatedSession.expires).toISOString()
            return { session: updatedSession, headers: cookieConfig.setCookie({ sessionToken: newToken }) }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: cookieConfig.clear() }
        }
    }

    const revokeToken = async (oauthId: string, headers: Headers, disconnect: boolean): Promise<Headers> => {
        const cookieName = `${cookies().accessToken.name}.${oauthId}`
        const cookie = getCookie(headers, cookieName)
        const provider = oauth[oauthId]

        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        if (!disconnect) {
            const decodedToken = await jwt.verifyToken(cookie)
            const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

            logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauthId, hasAccessToken: !!tokens.accessToken },
            })

            await revokeProviderToken(provider, tokens.accessToken)

            logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: { provider: oauthId },
            })
        }
        const builder = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookieName, "", getExpiredCookie(cookies().accessToken.attributes))
            .toHeaders()
        return toUnionHeaders(builder, headers)
    }

    const isProviderConnected = async (oauthId: string, headers: Headers): Promise<boolean> => {
        const cookieName = `${cookies().accessToken.name}.${oauthId}`
        let cookieValue: string
        try {
            cookieValue = getCookie(headers, cookieName)
        } catch {
            logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauthId, hasCookie: false },
            })
            return false
        }

        try {
            const decodedToken = await jwt.verifyToken(cookieValue)
            return !!decodedToken
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return false
        }
    }

    const refreshUserInfo = async (userInfo: TypedJWTPayload<DefaultUser>, headers: Headers) => {
        const sessionToken = await createSession(userInfo)

        const newHeaders = new HeadersBuilder(headers)
            .setCookie(cookies().sessionToken.name, sessionToken, cookies().sessionToken.attributes)
            .toHeaders()

        const session = await getStandardSession({
            jwt,
            identity,
            sessionToken,
        })
        const mergedHeaders = toUnionHeaders(newHeaders, secureApiHeaders)
        return { session, headers: mergedHeaders }
    }

    const signIn = async (oauthId: string, request: Request, redirectTo?: string) => {
        const provider = oauth[oauthId]
        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        const redirectURI = await createRedirectURI(request, oauthId, ctx)
        const redirectToValue = await createRedirectTo(request, redirectTo, ctx)

        const isOIDC = isOIDCProvider(provider)
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

        const headersBuilder = new HeadersBuilder(cacheControl)
            .setHeader("Location", authorization)
            .setCookie(cookies().state.name, state, cookies().state.attributes)
            .setCookie(cookies().redirectURI.name, redirectURI, cookies().redirectURI.attributes)
            .setCookie(cookies().redirectTo.name, redirectToValue, cookies().redirectTo.attributes)
            .setCookie(cookies().codeVerifier.name, codeVerifier, cookies().codeVerifier.attributes)

        if (nonce) {
            headersBuilder.setCookie(cookies().nonce.name, nonce, cookies().nonce.attributes)
        }
        return {
            success: true,
            signInURL: authorization,
            headers: headersBuilder.toHeaders(),
        }
    }

    const oauthCallback = async (oauthId: string, request: Request, { code, state }: { code: string; state: string }) => {
        const { oauth: providers, cookies, jose, logger, trustedOrigins } = ctx

        const oauthConfig = providers[oauthId]
        const isOIDC = isOIDCProvider(oauthConfig)
        const cookieState = getCookie(request, cookies.state.name)
        const codeVerifier = getCookie(request, cookies.codeVerifier.name)
        const cookieNonce = isOIDC ? getOptionalCookie(request, cookies.nonce.name) : undefined
        const cookieRedirectTo = getCookie(request, cookies.redirectTo.name)
        const cookieRedirectURI = getCookie(request, cookies.redirectURI.name)

        const clearCookieHeaders = new HeadersBuilder(cacheControl)
            .setCookie(cookies.state.name, "", getExpiredCookie(cookies.state.attributes))
            .setCookie(cookies.redirectURI.name, "", getExpiredCookie(cookies.redirectURI.attributes))
            .setCookie(cookies.redirectTo.name, "", getExpiredCookie(cookies.redirectTo.attributes))
            .setCookie(cookies.codeVerifier.name, "", getExpiredCookie(cookies.codeVerifier.attributes))
            .setCookie(cookies.nonce.name, "", getExpiredCookie(cookies.nonce.attributes))

        if (!timingSafeEqual(cookieState, state)) {
            logger?.log("MISMATCHING_STATE", {
                structuredData: {
                    oauth_provider: oauthId,
                },
            })
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_MISMATCHING_STATE",
                    message: "The provided state passed in the OAuth response does not match the stored token state.",
                },
                { headers: clearCookieHeaders.toHeaders(), status: 400 }
            )
        }

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(oauthConfig) : oauthConfig

        const accessToken = await createAccessToken(resolvedConfig, cookieRedirectURI, code, codeVerifier, logger)

        if (isOIDC) {
            if (!accessToken.id_token) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            const { issuer, jwks_uri } = resolvedConfig.oidc!
            if (!jwks_uri || !cookieNonce || !resolvedConfig.clientId) {
                throw new AuraAuthError({ code: "OIDC_ID_TOKEN_INVALID" })
            }
            await validateIDToken(accessToken.id_token, {
                issuer,
                clientId: resolvedConfig.clientId,
                nonce: cookieNonce,
                jwks_uri,
            })
        }

        if (!isRelativeURL(cookieRedirectTo)) {
            const origins = await getTrustedOrigins(request, trustedOrigins)
            const requestOrigin = await getOriginURL(request, ctx)
            let isValid = false
            try {
                isValid =
                    origins.length > 0
                        ? isTrustedOrigin(cookieRedirectTo, origins)
                        : isSameOrigin(cookieRedirectTo, requestOrigin)
            } catch {
                isValid = false
            }
            if (!isValid) {
                logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED", {
                    structuredData: {
                        redirect_path: cookieRedirectTo,
                        provider: oauthId,
                        has_trusted_origins: origins.length > 0,
                        request_origin: requestOrigin,
                    },
                })
                throw new AuraAuthError({ code: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED" })
            }
        }

        const userInfo = await getUserInfo(resolvedConfig, accessToken, logger)
        const session = await ctx.sessionStrategy.createSession(userInfo)
        const csrfToken = await createCSRF(jose)
        const tokenPayload = transformToTokenPayload(accessToken)
        const providerToken = await ctx.jwtManager.createToken(tokenPayload)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
            },
        })

        const headers = clearCookieHeaders
            .setHeader("Location", cookieRedirectTo)
            .setCookie(cookies.sessionToken.name, session, cookies.sessionToken.attributes)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(`${cookies.accessToken.name}.${oauthId}`, providerToken, cookies.accessToken.attributes)
            .toHeaders()

        return Response.json({ oauth }, { status: 302, headers: headers })
    }

    // JWT strategy: stateless tokens cannot be revoked server-side
    const revokeSession = async (_sessionId: string): Promise<void> => {}

    const destroySession = async (headers: Headers, skipCSRFCheck: boolean = false) => {
        await verifyCSRFToken({ headers, skipCSRFCheck, cookies: cookies(), logger, jose: jose as JoseInstance })
        await verifySessionToken({ headers, cookies: cookies(), jwt, logger })
        return cookieConfig.clear()
    }

    return {
        getSession,
        createSession,
        getProviderTokens,
        refreshSession,
        revokeSession,
        revokeToken,
        isProviderConnected,
        refreshUserInfo,
        destroySession,
        signIn,
        oauthCallback,
    }
}
