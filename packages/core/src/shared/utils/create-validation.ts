import { getBaseURL } from "@/config/get-base-url.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"
import { verifyRateLimit } from "@/shared/rate-limiter.ts"
import { getOptionalCookie } from "@/shared/http/cookie.ts"
import { createCSRF, createHash } from "@/exports/crypto.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
import { assertUserStatus } from "@/shared/utils/stateful.ts"
import { verifySessionToken } from "@/shared/utils/session.ts"
import { getOriginURL } from "@/shared/utils/get-origin-url.ts"
import { internal_verifyCSRFToken } from "@/shared/utils/api.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import type { AuraErrorCode } from "@/errors/catalog.ts"
import type { InternalCookieStoreConfig, RouterGlobalContext, RuntimeOAuthProvider } from "@/@types/internal.ts"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    RateLimiterConfig,
    RequestHeaders,
    SessionWithUserEntity,
    TypedJWTPayload,
    User,
} from "@/@types/index.ts"

export const createValidation = (
    ctx: RouterGlobalContext<any, any>,
    requestInit?: Request,
    headersInit?: HeadersInit | RequestHeaders
) => {
    const steps: Array<() => Promise<void>> = []
    const headers = getInitialHeaders(requestInit, headersInit)

    const output: {
        provider?: RuntimeOAuthProvider
        request?: Request
        rateLimit?: any
        userId?: string
        sessionId?: string
        origin?: string
        rawSession?: TypedJWTPayload<User> | SessionWithUserEntity
        sessionToken?: string
        cookieStore?: InternalCookieStoreConfig
    } = {}

    const builder = {
        verifyOAuthProvider: (oauth: LiteralUnion<BuiltInOAuthProvider>) => {
            steps.push(async () => {
                const provider = ctx.oauth[oauth]
                if (!provider) {
                    ctx.logger?.log("INVALID_OAUTH_CONFIGURATION", {
                        structuredData: { provider: oauth },
                    })
                    throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
                }
                output.provider = provider
            })
            return builder
        },
        verifySession: () => {
            steps.push(async () => {
                if (isStatelessStrategy(ctx.session.config)) {
                    const { session, sessionToken } = await verifySessionToken({
                        headers,
                        cookies: ctx.cookies.store,
                        jwt: ctx.jose.manager,
                    })
                    output.rawSession = session
                    output.sessionToken = sessionToken
                } else {
                    const { sessionToken } = createCookieManager(() => ctx.cookies.store).getCookie(headers)
                    if (!sessionToken) {
                        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
                    }
                    const tokenHash = await createHash(sessionToken)
                    const session = await ctx.session.config.adapter.getSessionByToken(tokenHash)
                    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
                        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
                    }
                    output.userId = session.userId
                    output.sessionId = session.id
                    // @unstable
                    output.rawSession = session
                    output.sessionToken = sessionToken
                }
            })
            return builder
        },
        verifyUserStatus: (error?: AuraErrorCode) => {
            steps.push(async () => {
                if (!output.rawSession) {
                    throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
                }
                if (isStatelessStrategy(ctx.session.config)) return
                const session = output.rawSession as SessionWithUserEntity
                assertUserStatus(session.user, { error })
            })
            return builder
        },
        verifyCSRFToken: (skipCSRFCheck: boolean, doubleSubmitToken: string | undefined, generateNewToken: boolean = false) => {
            steps.push(async () => {
                const existingCSRFToken = getOptionalCookie(headers, ctx.cookies.store.csrfToken.name)
                const csrfTokenValue = generateNewToken
                    ? await createCSRF(ctx.jose.instance, existingCSRFToken)
                    : existingCSRFToken
                await internal_verifyCSRFToken({
                    ctx,
                    headers,
                    skipCSRFCheck,
                    doubleSubmitToken,
                    csrfTokenValue,
                })
            })
            return builder
        },
        buildRequest: (endpointPath: string) => {
            steps.push(async () => {
                let request = requestInit
                if (!request) {
                    const origin = await getBaseURL({ ctx, headers })
                    const url = `${origin}${ctx.basePath}${endpointPath}`
                    request = new Request(url, { headers })
                }
                output.origin = await getOriginURL(request, ctx)
                output.request = request
                output.cookieStore = getCookieStore({ ctx, request })
            })
            return builder
        },
        verifyRateLimit: (action: keyof RateLimiterConfig) => {
            steps.push(async () => {
                if (!output.request) {
                    throw new Error("buildRequest must be called before verifyRateLimit")
                }
                const rateLimit = await verifyRateLimit(ctx, output.request, action)
                if (rateLimit) {
                    output.rateLimit = rateLimit
                }
            })
            return builder
        },
        execute: async () => {
            for (const step of steps) {
                await step()
                if (output.rateLimit) break
            }
            return output as {
                provider: RuntimeOAuthProvider
                request: Request
                rateLimit: any | undefined
                userId?: string
                sessionId?: string
                origin: string
                rawSession: TypedJWTPayload<User> | SessionWithUserEntity
                sessionToken: string
                cookieStore: InternalCookieStoreConfig
            }
        },
    }

    return builder
}
