import { createRateLimiter, type RateLimiterRule } from "@aura-stack/rate-limiter"
import type { RateLimiterConfig, RouterGlobalContext } from "@/@types/config.ts"

export const createRateLimiterInstance = (config?: RateLimiterConfig) => {
    const getLimitKey = (request: Request, action: string): string => {
        const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "anon"
        return `rl:${action}:${ip}`
    }

    return createRateLimiter<RateLimiterConfig>({
        rules: {
            signIn: {
                algorithm: "sliding-window",
                limit: 10,
                windowMs: 15 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "signIn"),
                ...config?.signIn,
            } as RateLimiterRule,
            signInCredentials: {
                algorithm: "sliding-window",
                limit: 8,
                windowMs: 15 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "signInCredentials"),
                ...config?.signInCredentials,
            } as RateLimiterRule,
            signUp: {
                algorithm: "fixed-window",
                limit: 5,
                windowMs: 60 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "signUp"),
                ...config?.signUp,
            } as RateLimiterRule,
            updateSession: {
                algorithm: "token-bucket",
                capacity: 10,
                refillRate: 1 / 60_000,
                keyGenerator: (request) => getLimitKey(request, "updateSession"),
                ...config?.updateSession,
            } as RateLimiterRule,
            getProviderTokens: {
                algorithm: "sliding-window",
                limit: 10,
                windowMs: 15 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "getProviderTokens"),
                ...config?.getProviderTokens,
            } as RateLimiterRule,
            refreshUserInfo: {
                algorithm: "sliding-window",
                limit: 10,
                windowMs: 15 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "refreshUserInfo"),
                ...config?.refreshUserInfo,
            } as RateLimiterRule,
            revokeToken: {
                algorithm: "sliding-window",
                limit: 10,
                windowMs: 15 * 60 * 1000,
                keyGenerator: (request) => getLimitKey(request, "revokeToken"),
                ...config?.revokeToken,
            } as RateLimiterRule,
        },
    })
}

const defaultValues = (action: keyof RateLimiterConfig) => {
    switch (action) {
        case "getProviderTokens":
            return { tokens: null }
        case "refreshUserInfo":
            return { session: null }
        case "revokeToken":
            return {}
        case "signIn":
            return { redirect: false, signInURL: null }
        case "updateSession":
            return { session: null, redirect: false, redirectURL: null }
        default:
            return {
                redirect: false,
                redirectURL: null,
            }
    }
}

/**
 * Should return rateLimit.toResponse() or custom body managed along the package ?
 */
export const verifyRateLimit = async (ctx: RouterGlobalContext, request: Request, action: keyof RateLimiterConfig) => {
    const rateLimit = await ctx.rateLimiters[action].check(request)
    if (!rateLimit.ok) {
        const toResponse = rateLimit.toResponse()
        const values = defaultValues(action)

        return {
            ...values,
            success: false,
            error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests." },
            headers: toResponse.headers,
            toResponse: () => toResponse,
        }
    }
    return undefined
}
