import { equals, patternToRegex } from "@/shared/utils.ts"
import type {
    AsymmetricKeyPair,
    AsymmetricKeyPairFromEnv,
    CryptoSecret,
    JWTConfig,
    JWTMode,
    JWTPayloadWithToken,
    SessionConfig,
} from "@/@types/index.ts"
import type { JWK } from "@aura-stack/jose/jose"
import { BaseSchema } from "valibot"
import { ZodObject, ZodTypeAny } from "zod"
import { Type } from "arktype"

export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || value === null || value === undefined || Number.isNaN(value)
}

export const isRequest = (value: unknown): value is Request => {
    return typeof Request !== "undefined" && value instanceof Request
}

export const unsafeChars = [
    "<",
    ">",
    '"',
    "`",
    " ",
    "\r",
    "\n",
    "\t",
    "\\",
    "%2F",
    "%5C",
    "%2f",
    "%5c",
    "\r\n",
    "%0A",
    "%0D",
    "%0a",
    "%0d",
    "..",
    "//",
    "///",
    "...",
    "%20",
    "\0",
]

export const isValidURL = (value: string): boolean => {
    if (!new RegExp(/^https?:\/\/[^/]/).test(value)) {
        return false
    }
    const match = value.match(/^(https?:\/\/)(.*)$/)
    if (!match) return false
    const rest = match[2]
    for (const char of unsafeChars) {
        if (rest.includes(char)) return false
    }
    const regex =
        /^https?:\/\/(?:[a-zA-Z0-9._-]+|localhost|\[[0-9a-fA-F:]+\])(?::\d{1,5})?(?:\/[a-zA-Z0-9._~!$&'()?#*+,;=:@-]*)*\/?$/

    return regex.test(match[0])
}

export const isJWTPayloadWithToken = (payload: unknown): payload is JWTPayloadWithToken => {
    return typeof payload === "object" && payload !== null && "token" in payload && typeof payload?.token === "string"
}

export const isRelativeURL = (value: string): boolean => {
    if (value.length > 100) return false
    for (const char of unsafeChars) {
        if (value.includes(char)) return false
    }
    const regex = /^\/[a-zA-Z0-9\-_/.?&=#]*\/?$/
    return regex.test(value)
}

export const isSameOrigin = (origin: string, expected: string): boolean => {
    const originURL = new URL(origin)
    const expectedURL = new URL(expected)
    return equals(originURL.origin, expectedURL.origin)
}

/**
 * Checks if a URL matches any of the trusted origin patterns.
 * A URL is trusted if its origin matches any pattern (exact or wildcard).
 *
 * @param url - The URL to validate (e.g. from Referer, Origin, redirectTo)
 * @param trustedOrigins - Array of exact URLs or patterns (e.g. `https://*.example.com`)
 */
export const isTrustedOrigin = (url: string, trustedOrigins: string[]): boolean => {
    if (!isValidURL(url) || trustedOrigins.length === 0) return false
    try {
        const urlOrigin = new URL(url).origin
        for (const pattern of trustedOrigins) {
            const regex = patternToRegex(pattern)
            if (regex?.test(urlOrigin)) return true
            try {
                if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return true
            } catch {}
        }
    } catch {}
    return false
}

/**
 * Extracts the JWT mode from a SessionConfig.
 * Defaults to "sealed" when no mode is specified.
 */
const getJWTMode = (config?: SessionConfig): JWTMode => {
    return config?.jwt?.mode ?? "sealed"
}

export const isSignedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode: "signed" }> } =>
    getJWTMode(config) === "signed"

export const isEncryptedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode: "encrypted" }> } =>
    getJWTMode(config) === "encrypted"

export const isSealedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode?: "sealed" }> } =>
    getJWTMode(config) === "sealed"

export const isCryptoKeyPair = (value: unknown): value is CryptoKeyPair => {
    return typeof value === "object" && value !== null && "publicKey" in value && "privateKey" in value
}

export const isCryptoKey = (value: unknown): value is CryptoKey => {
    return typeof value === "object" && value !== null && "algorithm" in value && "extractable" in value
}

export const isKeyPair = (value: unknown): value is AsymmetricKeyPair => {
    return typeof value === "object" && value !== null && "publicKey" in value && "privateKey" in value
}

export const isCryptoSecret = (value: unknown): value is CryptoSecret => {
    return (
        typeof value === "object" &&
        value !== null &&
        "sign" in value &&
        "encrypt" in value &&
        (isCryptoKey(value.sign) || isCryptoKeyPair(value.sign)) &&
        (isCryptoKey(value.encrypt) || isCryptoKeyPair(value.encrypt))
    )
}

export const isPEMFormattedKey = (value: unknown): value is string => {
    return typeof value === "string" && /-----BEGIN (PUBLIC|PRIVATE) KEY-----/.test(value)
}

export const isPEMFormattedKeyPairFromEnv = (value: unknown): value is { publicKey: string; privateKey: string } => {
    return (
        typeof value === "object" &&
        value !== null &&
        "publicKey" in value &&
        "privateKey" in value &&
        isPEMFormattedKey(value.publicKey) &&
        isPEMFormattedKey(value.privateKey)
    )
}

export const isJWTPEMFormattedKeyPair = (
    value: unknown
): value is { sign: AsymmetricKeyPairFromEnv; encrypt: AsymmetricKeyPairFromEnv } => {
    return (
        typeof value === "object" &&
        value !== null &&
        "sign" in value &&
        "encrypt" in value &&
        isPEMFormattedKeyPairFromEnv((value as any).sign) &&
        isPEMFormattedKeyPairFromEnv((value as any).encrypt)
    )
}

export const isJWKFormattedKey = (value: unknown): value is JWK => {
    return typeof value === "object" && value !== null && "kty" in value && typeof (value as any).kty === "string"
}

export const isValibotSchema = (value: unknown): value is BaseSchema<any, any, any> => {
    return typeof value === "object" && value !== null && "~run" in value && typeof (value as any)["~run"] === "function"
}

export const isValibotEntries = (value: unknown): value is Record<string, BaseSchema<any, any, any>> => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.values(value).length > 0 && // optional but useful
        Object.values(value).every(isValibotSchema)
    )
}

export const isZodSchema = (value: unknown): value is ZodObject<any> => {
    return typeof value === "object" && value !== null && "_def" in value
}

export const isZodEntries = (value: unknown): value is Record<string, ZodTypeAny> => {
    return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isZodSchema)
}

export const isArkType = (value: unknown): value is Type<{}, {}> => {
    return typeof value === "function" && value !== null && "allows" in value && "assert" in value
}
