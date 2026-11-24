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
import { verifyDoubleSubmitCSRFTokenFromRequest } from "./verify-csrf-token.ts"

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
                const outHeaders = ctx.cookies.manager.clear(output.cookieStore!)
                if (isStatelessStrategy(ctx.session.config)) {
                    const { session, sessionToken } = await verifySessionToken({
                        headers,
                        cookies: output.cookieStore!,
                        jwt: ctx.jose.manager,
                        outHeaders,
                    })
                    output.rawSession = session
                    output.sessionToken = sessionToken
                } else {
                    const { sessionToken } = ctx.cookies.manager.getCookie(headers, output.cookieStore!)
                    const outHeaders = ctx.cookies.manager.clear(output.cookieStore!)
                    if (!sessionToken) {
                        throw new AuraAuthError({ code: "SESSION_MISSING", headers: outHeaders })
                    }
                    const tokenHash = await createHash(sessionToken)
                    const session = await ctx.session.config.adapter.getSessionByToken(tokenHash)
                    if (!session) {
                        throw new AuraAuthError({ code: "SESSION_NOT_FOUND", headers: outHeaders })
                    }
                    if (session.revokedAt || session.status === "revoked") {
                        throw new AuraAuthError({ code: "SESSION_REVOKED", headers: outHeaders })
                    }
                    if (new Date() >= session.expiresAt || session.status === "expired") {
                        throw new AuraAuthError({ code: "SESSION_EXPIRED", headers: outHeaders })
                    }
                    if (session.status !== "active") {
                        throw new AuraAuthError({ code: "SESSION_INACTIVE", headers: outHeaders })
                    }
                    if (!session.user) {
                        throw new AuraAuthError({ code: "USER_NOT_FOUND", headers: outHeaders })
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
                assertUserStatus(session.user, { error, headers: ctx.cookies.manager.clear(output.cookieStore!) })
            })
            return builder
        },
        verifyCSRFToken: (skipCSRFCheck: boolean, doubleSubmitToken: string | undefined, generateNewToken: boolean = false) => {
            steps.push(async () => {
                const token = getOptionalCookie(headers, output.cookieStore!.csrfToken.name!)
                const csrfTokenValue = generateNewToken ? await createCSRF(ctx.jose.instance, token) : token
                await verifyDoubleSubmitCSRFTokenFromRequest({
                    ctx,
                    headers,
                    skipCSRFCheck,
                    doubleSubmitToken,
                    csrfTokenValue,
                    cookieStore: output.cookieStore!,
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
