import { isRelativeURL, isSameOrigin, isTrustedOrigin } from "@/shared/assert.ts"
import { createCSRF, createHash, createSecretValue } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { validateIDToken } from "@/shared/oidc/id-token.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { getOriginURL, getTrustedOrigins } from "@/shared/utils/authorization.ts"
import { createAccessToken, getUserInfo } from "@/shared/utils/oauth.ts"
import type { InternalStatefulContext } from "@/@types/session.ts"
import { createDevice as __createDevice } from "./utils.ts"
import { HeadersBuilder } from "@aura-stack/router"

export const __oauthCallback = ({ ctx, cookies, cookieConfig }: InternalStatefulContext) => {
    const { logger, jose, oauth, sessionConfig } = ctx
    const createDevice = __createDevice({ ctx, cookies, cookieConfig })

    return async (oauthId: string, request: Request, { code, state }: { code: string; state: string }) => {
        const oauthConfig = oauth[oauthId]
        if (!oauthConfig) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        const isOIDC = isOIDCProvider(oauthConfig)
        const transaction = await sessionConfig.adapter.getOAuthTransactionByState(state)

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
            await sessionConfig.adapter.deleteExpiredOAuthTransactions()
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

        await sessionConfig.adapter.consumeOAuthTransaction(state)

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
        const user = await sessionConfig.adapter.getUserByEmail(userInfo.email)

        if (user) {
            userId = user.id
            const { sub: _, name, email, image, ...attributes } = userInfo
            await sessionConfig.adapter.updateUser(userId, {
                name,
                email,
                image,
                attributes,
            })
        } else {
            const { email, image, name, ...attributes } = userInfo
            const newUser = await sessionConfig.adapter.createUser({
                id: crypto.randomUUID(),
                email: email,
                name: name,
                image: image,
                emailVerifiedAt: new Date(),
                status: "active",
                mfaEnabled: false,
                mfaPreferredMethod: null,
                attributes: attributes,
            })
            userId = newUser.id
        }

        let accountId: string
        const account = await sessionConfig.adapter.getAccountByProvider(oauthId, userInfo.sub)

        if (account) {
            accountId = account.id
            await sessionConfig.adapter.updateOAuthTokens(account.id, {
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
            const newAccount = await sessionConfig.adapter.createAccount({
                id: crypto.randomUUID(),
                userId,
                provider: oauthId,
                providerUserId: userInfo.sub,
                type: "oauth",
                status: "active",
            })
            accountId = newAccount.id

            await sessionConfig.adapter.createOAuthAccount({
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

        await sessionConfig.adapter.createSession({
            id: crypto.randomUUID(),
            userId,
            deviceId: device.id,
            authenticatedWith: "oauth",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            mfaState: "none",
            status: "active",
            tokenHash,
            metadata: null,
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
            .setCookie(cookies().sessionToken.name, tokenHash, cookies().sessionToken.attributes)
            .setCookie(cookies().csrfToken.name, csrfToken, cookies().csrfToken.attributes)

        return Response.json({ oauth: oauthId }, { status: 302, headers: headersBuilder.toHeaders() })
    }
}
