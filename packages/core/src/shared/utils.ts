import { getEnv } from "@/shared/env.ts"
import { isString } from "@/shared/assert.ts"
import { encoder } from "@aura-stack/jose/crypto"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { OAuthTokenPayload } from "@/@types/index.ts"
import type { OAuthAccessTokenResponseType } from "@/@types/internal.ts"

export const AURA_AUTH_VERSION = "0.9.0"

export const equals = (a: string | number | undefined | null, b: string | number | undefined | null) => {
    if (a === null || b === null || a === undefined || b === undefined) return false
    return a === b
}

export const extractPath = (url: string): string => {
    const pathRegex = /^https?:\/\/[a-zA-Z0-9_\-.]+(:\d+)?(\/.*)$/
    const match = url.match(pathRegex)
    return match && match[2] ? match[2] : "/"
}

/**
 * Converts a trusted origin pattern to a regex for matching.
 * Supports `*` as subdomain wildcard: `https://*.example.com` matches `https://app.example.com`
 * @todo: add support to Custom URI Schemes (e.g. `myapp://*`).
 */
export const patternToRegex = (pattern: string): RegExp | null => {
    try {
        if (pattern.length > 2048) return null

        pattern = pattern.replace(/\\/g, "")
        const match = pattern.match(/^(https?):\/\/([a-zA-Z0-9.*-]{1,253})(?::(\d{1,5}|\*))?(?:\/.*)?$/)
        if (!match) return null

        const [, protocol, host, port] = match
        const hasWildcard = host.includes("*")
        if (hasWildcard && !host.startsWith("*.")) return null
        if (hasWildcard && !host.startsWith("*.")) return null
        if (hasWildcard && host.slice(2).includes("*")) return null

        const domain = hasWildcard ? host.slice(2) : host
        const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const hostRegex = hasWildcard ? `[^.]+\\.${escapedDomain}` : escapedDomain
        const portRegex = port === "*" ? ":\\d{1,5}" : port ? `:${port}` : ""

        return new RegExp(`^${protocol}:\\/\\/${hostRegex}${portRegex}$`)
    } catch {
        return null
    }
}

export const createBasicAuthHeader = (username: string, password: string): string => {
    const getUsername = getEnv(username) ?? username
    const getPassword = getEnv(password) ?? password
    if (!getUsername || !getPassword) {
        throw new AuraAuthError({ code: "AUTH_BASIC_CREDENTIALS_INVALID" })
    }
    const credentials = `${getUsername}:${getPassword}`
    const binaryCredentials = String.fromCharCode.apply(null, Array.from(encoder.encode(credentials)))
    return `Basic ${btoa(binaryCredentials)}`
}

export const shouldRefresh = (payload: OAuthTokenPayload, refreshWindow: number): boolean => {
    if (!payload.accessTokenExpiresAt && !payload.refreshToken) return false
    const now = Math.floor(Date.now() / 1000)
    if (now >= payload.expiresAt) return true
    if (payload.expiresAt - now <= refreshWindow) return true
    return false
}

export const merge = (origin: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const key in source) {
        if (source[key] instanceof Object && !(source[key] instanceof Array) && key in origin) {
            Object.assign(source[key], merge(origin[key] as Record<string, unknown>, source[key] as Record<string, unknown>))
        }
    }
    return { ...origin, ...source }
}

export const transformToTokenPayload = (tokens: OAuthAccessTokenResponseType & { id_token?: string }) => {
    const now = Math.floor(Date.now() / 1000)
    return {
        accessToken: tokens.access_token,
        expiresAt: tokens.expires_in ? now + tokens.expires_in : undefined,
        refreshToken: tokens.refresh_token,
        refreshTokenExpiresAt: tokens.refresh_token_expires_in ? now + tokens.refresh_token_expires_in : undefined,
        idToken: tokens.id_token,
        tokenType: tokens.token_type ?? "Bearer",
        scopes: isString(tokens.scope) ? [tokens.scope] : Array.isArray(tokens.scope) ? tokens.scope : [],
        issuedAt: now,
    }
}
