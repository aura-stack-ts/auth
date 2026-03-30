import type { RateLimitResult } from "@/types"

export const toContent = (raw: Omit<RateLimitResult, "toResponse">) => ({
    ...raw,
    toResponse(): Response {
        const headers = new Headers({
            "Content-Type": "application/json",
            "Retry-After": raw.retryAfter.toString(),
            "X-RateLimit-Limit": raw.limit.toString(),
            "X-RateLimit-Remaining": raw.remaining.toString(),
            "X-RateLimit-Reset": Math.ceil(raw.resetAt / 1000).toString(),
        })
        return Response.json(
            {
                error: "Too Many Requests",
                retryAfter: raw.retryAfter,
                resetAt: raw.resetAt,
            },
            { status: 429, headers }
        )
    },
})
