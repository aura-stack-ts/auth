import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { verifyOIDCConfig } from "@/shared/oidc/verify-oidc-config.ts"
import { createCSRF, createHash, createSecretValue } from "@/exports/crypto.ts"
import { createDevice as createDeviceHelper } from "@/shared/utils/session-strategy.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAccessToken, createRedirectTo, getUserInfo } from "@/shared/oauth2/index.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"
import { assertUserStatus } from "@/shared/utils/stateful.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"

export const oauthCallback = (ctx: InternalContextForStateful): SessionStrategy["oauthCallback"] => {
    const { logger, jose, session } = ctx
    const createDevice = createDeviceHelper(ctx)

    return async ({ oauthId, provider, request, params: { state, code } }) => {
        const isOIDC = isOIDCProvider(provider)
        const transaction = await session.config.adapter.getOAuthTransactionByState(state)

        if (!transaction) {
            throw new AuraAuthError({ code: "AUTH_MISMATCHING_STATE" })
        }

        if (new Date() > transaction.expiresAt) {
            await session.config.adapter.deleteExpiredOAuthTransactions()
            throw new AuraAuthError({ code: "AUTH_TRANSACTION_EXPIRED" })
        }

        if (transaction.provider !== oauthId) {
            throw new AuraAuthError({ code: "AUTH_PROVIDER_MISMATCH" })
        }

        await session.config.adapter.consumeOAuthTransaction(state)
        const resolvedConfig = isOIDC ? await resolveOpenIDProvider(provider) : provider

        if (!transaction.codeVerifier) {
            throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" })
        }

        const accessToken = await createAccessToken(
            resolvedConfig,
            transaction.redirectURI,
            code,
            transaction.codeVerifier,
            logger
        )

        await verifyOIDCConfig({
            isOIDC,
            accessToken,
            nonce: transaction.nonce,
            config: resolvedConfig,
        })

        const redirectTo = transaction.redirectTo ? await createRedirectTo(request, transaction.redirectTo, ctx) : "/"
        const userInfo = await getUserInfo(resolvedConfig, accessToken, logger)

        if (!userInfo.email) {
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        let userId: string
        const user = await session.config.adapter.getUserByEmail(userInfo.email)

        if (user) {
            assertUserStatus(user)
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

        const csrfToken = await createCSRF(jose.instance)

        logger?.log("OAUTH_CALLBACK_SUCCESS", {
            structuredData: {
                provider: oauthId,
                user_id: userId,
            },
        })

        const headers = new HeadersBuilder(secureApiHeaders)
            .setHeader("Location", redirectTo)
            .setCookie(ctx.cookies.store.sessionToken.name, sessionToken, ctx.cookies.store.sessionToken.attributes)
            .setCookie(ctx.cookies.store.csrfToken.name, csrfToken, ctx.cookies.store.csrfToken.attributes)
            .toHeaders()

        return { headers }
    }
}
