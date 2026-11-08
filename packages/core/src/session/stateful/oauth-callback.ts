import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { getTrustedOrigins } from "@/config/get-trusted-origins.ts"
import { createAccessToken, getUserInfo } from "@/shared/oauth2/index.ts"
import { createCSRF, createHash, createSecretValue } from "@/shared/crypto.ts"
import { createDevice as createDeviceHelper } from "@/shared/utils/session-strategy.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { getOriginURL, isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/utils/get-origin-url.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const oauthCallback = (ctx: InternalContextForStateful): SessionStrategy["oauthCallback"] => {
    const { logger, jose, oauth, session } = ctx
    const createDevice = createDeviceHelper(ctx)

    return async ({ oauthId, request, params: { state, code } }) => {
        const oauthConfig = oauth[oauthId]
        if (!oauthConfig) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        const isOIDC = isOIDCProvider(oauthConfig)
        const transaction = await session.config.adapter.getOAuthTransactionByState(state)

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

        if (new Date() > transaction.expiresAt) {
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    oauth_provider: oauthId,
                    state,
                    expires_at: transaction.expiresAt.toISOString(),
                },
            })
            await session.config.adapter.deleteExpiredOAuthTransactions()
            return Response.json(
                {
                    type: "PROTOCOL",
                    code: "AUTH_TRANSACTION_EXPIRED",
                    message: "The OAuth transaction has expired. Please try signing in again.",
                },
                { status: 400 }
            )
        }

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

        await session.config.adapter.consumeOAuthTransaction(state)

        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(oauthConfig) : oauthConfig

        if (!transaction.codeVerifier) {
            throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" as any })
        }

        const accessToken = await createAccessToken(
            resolvedConfig,
            transaction.redirectURI,
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

        if (transaction.redirectTo && !isRelativeURL(transaction.redirectTo)) {
            const origins = await getTrustedOrigins(request, ctx.trustedOrigins)
            const requestOrigin = await getOriginURL(request, ctx)
            let isValid = false
            try {
                isValid =
                    origins.length > 0
                        ? isTrustedOrigin(transaction.redirectTo, origins)
                        : isSameOrigin(transaction.redirectTo, requestOrigin)
            } catch {
                isValid = false
            }
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

        if (!userInfo.email) {
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        let userId: string
        const user = await session.config.adapter.getUserByEmail(userInfo.email)

        if (user) {
            userId = user.id
            const { sub: _, name, email, image, ...attributes } = userInfo
            await session.config.adapter.updateUser(userId, {
                name,
                email,
                image,
                attributes,
            })
        } else {
            const { sub: _sub, email, image, name, ...attributes } = userInfo
            const newUser = await session.config.adapter.createUser({
                id: crypto.randomUUID(),
                email: email,
                name: name,
                image: image,
                emailVerifiedAt: new Date(),
                status: "active",
                attributes: attributes,
            })
            userId = newUser.id
        }

        let accountId: string
        const account = await session.config.adapter.getAccountByProvider(oauthId, userInfo.sub)

        if (account) {
            if (account.userId !== userId) {
                logger?.log("OAUTH_ACCOUNT_USER_MISMATCH")
                throw new AuraAuthError({ code: "OAUTH_ACCOUNT_USER_MISMATCH" })
            }

            accountId = account.id
            await session.config.adapter.updateOAuthTokens(account.id, {
                accessToken: accessToken.access_token,
                refreshToken: accessToken.refresh_token || null,
                idToken: accessToken.id_token || null,
                tokenType: accessToken.token_type,
                scopes: Array.isArray(accessToken.scope) ? accessToken.scope.join(" ") : accessToken.scope || null,
                accessTokenExpiresAt: accessToken.expires_in ? new Date(Date.now() + accessToken.expires_in * 1000) : null,
                refreshTokenExpiresAt: accessToken.refresh_token_expires_in
                    ? new Date(Date.now() + accessToken.refresh_token_expires_in * 1000)
                    : null,
            })
        } else {
            const newAccount = await session.config.adapter.createAccount({
                id: crypto.randomUUID(),
                userId,
                provider: oauthId,
                providerUserId: userInfo.sub,
                type: "oauth",
                status: "active",
            })
            accountId = newAccount.id

            await session.config.adapter.createOAuthAccount({
                accountId,
                accessToken: accessToken.access_token,
                refreshToken: accessToken.refresh_token || null,
                idToken: accessToken.id_token || null,
                tokenType: accessToken.token_type,
                scopes: Array.isArray(accessToken.scope) ? accessToken.scope.join(" ") : accessToken.scope || null,
                accessTokenExpiresAt: accessToken.expires_in ? new Date(Date.now() + accessToken.expires_in * 1000) : null,
                refreshTokenExpiresAt: accessToken.refresh_token_expires_in
                    ? new Date(Date.now() + accessToken.refresh_token_expires_in * 1000)
                    : null,
            })
        }

        const device = await createDevice(userId, request)
        const sessionToken = createSecretValue(64)
        const tokenHash = await createHash(sessionToken)

        await session.config.adapter.createSession({
            id: crypto.randomUUID(),
            userId,
            deviceId: device.id,
            authenticatedWith: "oauth",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            mfaState: "none",
            status: "active",
            tokenHash,
        })

        const csrfToken = await createCSRF(jose)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
                user_id: userId,
            },
        })

        const headersBuilder = new HeadersBuilder()
            .setHeader("Location", transaction.redirectTo || "/")
            .setCookie(ctx.cookies.store.sessionToken.name, sessionToken, ctx.cookies.store.sessionToken.attributes)
            .setCookie(ctx.cookies.store.csrfToken.name, csrfToken, ctx.cookies.store.csrfToken.attributes)

        return Response.json({ oauth: oauthId }, { status: 302, headers: headersBuilder.toHeaders() })
    }
}
