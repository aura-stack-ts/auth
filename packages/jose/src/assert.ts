import { AuraJoseError, InvalidSecretError } from "@/errors.ts"
import type { AsymmetricKeyPair } from "@/index.ts"

export const isAuraJoseError = (error: unknown): error is AuraJoseError => {
    return error instanceof AuraJoseError
}

export const isInvalidSecretError = (error: unknown): error is InvalidSecretError => {
    return error instanceof InvalidSecretError
}

export const isFalsy = (value: unknown): boolean => {
    return value === null || value === undefined || value === false || value === 0 || value === "" || Number.isNaN(value)
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const isInvalidPayload = (payload: unknown): boolean => {
    return (
        isFalsy(payload) ||
        !isObject(payload) ||
        (typeof payload === "object" && payload !== null && !Array.isArray(payload) && Object.keys(payload).length === 0)
    )
}

export const isAsymmetricKeyPair = (value: unknown): value is AsymmetricKeyPair => {
    return typeof value === "object" && value !== null && "publicKey" in value && "privateKey" in value
}

export const isJWKKey = (value: unknown): value is JsonWebKey => {
    return typeof value === "object" && value !== null && "kty" in value && typeof (value as JsonWebKey).kty === "string"
}

export const isCryptoKey = (value: unknown): value is CryptoKey => {
    return typeof value === "object" && value !== null && "type" in value && typeof (value as CryptoKey).type === "string"
}

export const isRSAJwk = (key: unknown): boolean => {
    return typeof key === "object" && key !== null && "kty" in key && (key as { kty?: unknown }).kty === "RSA"
}
