import { HeadersBuilder, type RequestHeaders } from "@aura-stack/router"
import { getOptionalCookie } from "@/cookie.ts"
import { assertCSRFTokenCookie, createCSRF, createHash } from "@/shared/crypto.ts"
import { verifyRateLimit } from "@/router/rate-limiter.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { isHeadersInit, isStatelessStrategy } from "@/shared/assert.ts"
import { getErrorName, verifyCSRFToken, verifySessionToken } from "@/shared/utils.ts"
import { getBaseURL, getOriginURL, createRedirectTo } from "@/shared/utils/authorization.ts"
import type {
    BuiltInOAuthProvider,
    LiteralUnion,
    RateLimiterConfig,
    UpdateSessionAPIOptions,
    SignInCredentialsAPIOptions,
    SignUpAPIOptions,
    RefreshUserInfoAPIOptions,
    RevokeTokenAPIOptions,
    DisconnectProviderAPIOptions,
    SignOutAPIOptions,
} from "@/@types/index.ts"
import type { InternalLogger, RouterGlobalContext, RuntimeOAuthProvider } from "@/@types/internal.ts"
import type { LOG_MESSAGES } from "@/shared/logger.ts"

export const createValidation = (ctx: RouterGlobalContext, headersInit?: HeadersInit) => {
    const headers = new Headers(headersInit)
    const steps: Array<() => Promise<void>> = []

    const output: {
        provider?: RuntimeOAuthProvider
        request?: Request
        rateLimit?: any
        headers: Headers
    } = { headers }

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
                if (isStatelessStrategy(ctx.sessionConfig)) {
                    await verifySessionToken({
                        headers: output.headers,
                        cookies: ctx.cookies,
                        jwt: ctx.jwtManager,
                        logger: ctx.logger,
                    })
                } else {
                    const { sessionToken } = createCookieManager(() => ctx.cookies).getCookie(new Headers(headersInit))
                    if (!sessionToken) {
                        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
                    }
                    const tokenHash = await createHash(sessionToken)
                    const session = await ctx.sessionConfig.adapter.getSessionByToken(tokenHash)
                    if (!session) {
                        throw new AuraAuthError({ code: "SESSION_NOT_FOUND" })
                    }
                }
            })
            return builder
        },
        verifyCSRFToken: (skipCSRFCheck: boolean) => {
            steps.push(async () => {
                const existingCSRFToken = getOptionalCookie(output.headers, ctx.cookies.csrfToken.name)
                assertCSRFTokenCookie(ctx.jose, existingCSRFToken)
                const csrfTokenValue = await createCSRF(ctx.jose, existingCSRFToken)
                await verifyCSRFToken({
                    headers: output.headers,
                    cookies: ctx.cookies,
                    jose: ctx.jose,
                    logger: ctx.logger,
                    skipCSRFCheck,
                    csrfTokenValue,
                })
            })
            return builder
        },
        buildRequest: (requestInit: Request | undefined, endpointPath: string) => {
            steps.push(async () => {
                let request = requestInit
                if (!request) {
                    const origin = await getBaseURL({ ctx, headers: output.headers })
                    const url = `${origin}${ctx.basePath}${endpointPath}`
                    request = new Request(url, { headers: output.headers })
                }
                await getOriginURL(request, ctx)
                output.request = request
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
                headers: Headers
            }
        },
    }

    return builder
}

export const handleApiError = (error: unknown, defaultCode: string, defaultMessage: string, defaultStatus = 400) => {
    let code = defaultCode
    let message = defaultMessage
    let statusCode = defaultStatus
    if (isAuraAuthError(error)) {
        code = error.code
        message = error.userMessage
        statusCode = error.statusCode
    }
    return { code, message, errors: { code, message }, statusCode }
}

export const resolveApiRedirect = async (
    ctx: RouterGlobalContext,
    request: Request,
    redirectInit: boolean,
    redirectToInit: string | undefined,
    headers: Headers | HeadersBuilder
) => {
    let redirectURL: string | null = await createRedirectTo(request, redirectToInit, ctx)
    redirectURL = redirectToInit ? redirectURL : redirectURL === "/" ? null : redirectURL

    if (redirectInit && redirectURL) {
        if (headers instanceof HeadersBuilder) {
            headers.setHeader("Location", redirectURL)
        } else {
            headers.set("Location", redirectURL)
        }
    }

    const shouldRedirectServer = redirectInit && !!redirectURL
    return {
        redirect: shouldRedirectServer,
        redirectURL: redirectInit ? null : redirectURL,
    }
}

export const toStandardizedHeaders = (headers: Headers | HeadersInit | RequestHeaders): Headers => {
    return isHeadersInit(headers)
        ? new Headers(headers)
        : headers instanceof Headers
          ? headers
          : new Headers(headers as Record<string, string>)
}

export const assertDoubleSubmitToken = (
    options:
        | UpdateSessionAPIOptions
        | SignInCredentialsAPIOptions
        | SignUpAPIOptions
        | RefreshUserInfoAPIOptions
        | RevokeTokenAPIOptions
        | DisconnectProviderAPIOptions
        | SignOutAPIOptions
) => {
    if (options.doubleSubmitToken) {
        options.skipCSRFCheck = false
        options.headers = new Headers(toStandardizedHeaders(options.headers || {}))
        options.headers.set("x-csrf-token", options.doubleSubmitToken)
        options.request?.headers.set("x-csrf-token", options.doubleSubmitToken)
    } else {
        if (options.skipCSRFCheck === undefined || options.skipCSRFCheck === true) {
            options.skipCSRFCheck = true
            options.doubleSubmitToken = "token"
        }
    }
}

export const errorToLogMessage = (error: unknown, key: keyof typeof LOG_MESSAGES, logger?: InternalLogger) => {
    logger?.log(key, {
        structuredData: {
            error_type: getErrorName(error),
            error_code: error instanceof AuraAuthError ? error.code : "UNKNOWN_ERROR",
            error_message: error instanceof AuraAuthError ? error.message : String(error),
        },
    })
}
