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
import { verifyDoubleSubmitCSRFTokenFromRequest } from "@/shared/utils/verify-csrf-token.ts"
import type { RoutePattern } from "@aura-stack/router"
import type { AuraErrorCode } from "@/errors/catalog.ts"
import type { FunctionAPIContext, InternalCookieStoreConfig, RuntimeOAuthProvider } from "@/@types/internal.ts"
import type {
    APIOptionsWithRequest,
    APIOptionsWithSkipCSRFCheck,
    BuiltInOAuthProvider,
    LiteralUnion,
    RateLimiterConfig,
    SessionWithUserEntity,
    TypedJWTPayload,
    User,
} from "@/@types/index.ts"

export const createValidation = <Context extends FunctionAPIContext<object>>(context: Context) => {
    const steps: Array<() => Promise<void>> = []
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
                const provider = context.ctx.oauth[oauth]
                if (!provider) {
                    context.ctx.logger?.log("INVALID_OAUTH_CONFIGURATION", {
                        structuredData: { provider: oauth },
                    })
                    throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
                }
                output.provider = provider
            })
            return builder
        },
        buildRequest(path: RoutePattern) {
            const local = context as FunctionAPIContext<any> as FunctionAPIContext<APIOptionsWithRequest>
            steps.push(async () => {
                let request = local.request
                const headers = getInitialHeaders(local.request, local.headers)
                if (!request) {
                    const origin = await getBaseURL({ ctx: local.ctx, headers })
                    const url = `${origin}${local.ctx.basePath}${path}`
                    request = new Request(url, { headers })
                }
                output.origin = await getOriginURL(request, local.ctx)
                output.request = request
                output.cookieStore = getCookieStore({ ctx: local.ctx, request })
            })
            return builder
        },
        verifyRateLimit: (action: keyof RateLimiterConfig) => {
            steps.push(async () => {
                if (!output.request) {
                    throw new Error("buildRequest must be called before verifyRateLimit")
                }
                const rateLimit = await verifyRateLimit(context.ctx, output.request, action)
                if (rateLimit) {
                    output.rateLimit = rateLimit
                }
            })
            return builder
        },
        verifySession: () => {
            steps.push(async () => {
                const local = context as FunctionAPIContext<any> as FunctionAPIContext<APIOptionsWithRequest>
                const headers = getInitialHeaders(local.request, local.headers)
                const outHeaders = local.ctx.cookies.manager.clear(output.cookieStore!)
                if (isStatelessStrategy(local.ctx.session.config)) {
                    const { session, sessionToken } = await verifySessionToken({
                        headers,
                        cookies: output.cookieStore!,
                        jwt: local.ctx.jose.manager,
                        outHeaders,
                    })
                    output.rawSession = session
                    output.sessionToken = sessionToken
                } else {
                    const { sessionToken } = local.ctx.cookies.manager.getCookie(headers, output.cookieStore!)
                    const outHeaders = local.ctx.cookies.manager.clear(output.cookieStore!)
                    if (!sessionToken) {
                        throw new AuraAuthError({ code: "SESSION_MISSING" })
                    }
                    const tokenHash = await createHash(sessionToken)
                    const session = await local.ctx.session.config.adapter.getSessionByToken(tokenHash)
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
                if (isStatelessStrategy(context.ctx.session.config)) return
                const session = output.rawSession as SessionWithUserEntity
                assertUserStatus(session.user, { error, headers: context.ctx.cookies.manager.clear(output.cookieStore!) })
            })
            return builder
        },
        verifyCSRFToken(generateToken: boolean = false) {
            steps.push(async () => {
                const local = context as FunctionAPIContext<any> as FunctionAPIContext<
                    APIOptionsWithSkipCSRFCheck & APIOptionsWithRequest
                >
                context.ctx.logger?.log("CSRF_TOKEN_VALIDATION", {
                    structuredData: {
                        skipCSRFCheck: local.skipCSRFCheck ?? false,
                        doubleSubmitToken: local.doubleSubmitToken ? "provided" : "not_provided",
                    },
                })
                const headers = getInitialHeaders(local.request, local.headers)

                const token = getOptionalCookie(headers, output.cookieStore!.csrfToken.name!)
                const csrfTokenValue = generateToken ? await createCSRF(local.ctx.jose.instance, token) : token
                await verifyDoubleSubmitCSRFTokenFromRequest({
                    ctx: local.ctx,
                    headers,
                    skipCSRFCheck: local.skipCSRFCheck || false,
                    doubleSubmitToken: local.doubleSubmitToken,
                    csrfTokenValue,
                    cookieStore: output.cookieStore!,
                })
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
