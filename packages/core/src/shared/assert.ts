import { Type } from "arktype"
import { Type as TypeboxType } from "typebox"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { ZodObject, ZodTypeAny } from "zod"
import type { JWK } from "@aura-stack/jose/jose"
import type { BaseSchema, ObjectSchema } from "valibot"
import type { InternalLogger, AsymmetricKeyPairFromEnv, JWTPayloadWithToken } from "@/@types/internal.ts"
import type {
    AccessTokenContext,
    AsymmetricKeyPair,
    CryptoSecret,
    JWTConfig,
    JWTMode,
    OAuthProviderConfig,
    SessionConfig,
    StatefulStrategyConfig,
    StatelessStrategyConfig,
    TrustedProxyHeadersSource,
} from "@/@types/index.ts"

// #region Type Guards
export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || isNullOrUndefined(value) || Number.isNaN(value)
}

export const isRequest = (value: unknown): value is Request => {
    return typeof Request !== "undefined" && value instanceof Request
}

export const isResponse = (value: unknown): value is Response => {
    return typeof Response !== "undefined" && value instanceof Response
}

export const isString = (value: unknown): value is string => {
    return typeof value === "string"
}

export const isBoolean = (value: unknown): value is boolean => {
    return typeof value === "boolean"
}

export const isObject = (value: unknown): value is Record<string, any> => {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
    return value === null || value === undefined
}

// #region JWT and Session
export const isJWTPayloadWithToken = (payload: unknown): payload is JWTPayloadWithToken => {
    return typeof payload === "object" && payload !== null && "token" in payload && typeof payload?.token === "string"
}

export const isStatelessStrategy = (config?: SessionConfig): config is StatelessStrategyConfig => {
    return config?.strategy === "jwt" || config?.strategy === undefined
}

export const isStatefulStrategy = (config?: SessionConfig): config is StatefulStrategyConfig => {
    return config?.strategy === "database"
}

/**
 * Extracts the JWT mode from a SessionConfig.
 * Defaults to "sealed" when no mode is specified.
 */
const getJWTMode = (config?: SessionConfig): JWTMode => {
    return isStatelessStrategy(config) ? (config?.jwt?.mode ?? "sealed") : "sealed"
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

// #region Identities
export const isValibotSchema = (value: unknown): value is ObjectSchema<any, undefined> => {
    return typeof value === "object" && value !== null && "~run" in value && typeof (value as any)["~run"] === "function"
}

export const isValibotEntries = (value: unknown): value is Record<string, BaseSchema<any, any, any>> => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.values(value).length > 0 &&
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

export const isTypeboxEntries = (value: unknown): value is TypeboxType.TProperties => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.values(value).every((v) => typeof v === "object" && "type" in v)
    )
}

export const isCustomUserInfoFunction = (
    value: OAuthProviderConfig["userInfo"]
): value is Extract<OAuthProviderConfig["userInfo"], { request: (context: AccessTokenContext) => any }> => {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof value.url === "string" &&
        "request" in value &&
        typeof value.request === "function"
    )
}

export const assertContentTypeResponse = (response: Response, logger?: InternalLogger | undefined) => {
    const contentType = response.headers.get("Content-Type")
    const mediaType = contentType?.split(";")[0]?.trim().toLowerCase()
    if (mediaType !== "application/json") {
        logger?.log("OAUTH_INVALID_CONTENT_TYPE", {
            structuredData: { content_type: contentType! },
        })
        throw new AuraAuthError({ code: "OAUTH_INVALID_CONTENT_TYPE" })
    }
}

export const isRefreshTokenObject = (value: unknown): value is Exclude<OAuthProviderConfig["refreshToken"], string> => {
    return isObject(value) && "url" in value
}

export const isInvalidSlidingThreshold = (value: unknown): value is number => {
    return typeof value === "number" && (Number.isNaN(value) || value < 0 || value > 1)
}

export const isHeadersInit = (value: unknown): value is HeadersInit => {
    return typeof value === "object" && value !== null && (value instanceof Headers || Array.isArray(value) || isObject(value))
}

// #region Trusted Proxy Headers Source
export const isTrustedProxyHeadersSource = (value: unknown): value is TrustedProxyHeadersSource => {
    return isTrustedProxyHeadersSourceURL(value) || isTrustedProxyHeadersSourceProtocolHost(value)
}

export const isTrustedProxyHeadersSourceURL = (value: unknown): value is { url: string } => {
    return typeof value === "object" && value !== null && "url" in value
}

export const isTrustedProxyHeadersSourceProtocolHost = (value: unknown): value is { protocol: string; host: string } => {
    return (
        typeof value === "object" &&
        value !== null &&
        "protocol" in value &&
        "host" in value &&
        typeof (value as any).protocol === "string" &&
        typeof (value as any).host === "string"
    )
}
