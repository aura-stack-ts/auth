import { AuraJoseError, InvalidSecretError } from "./errors.js"

export const isAuraJoseError = (error: unknown): error is AuraJoseError => {
    return error instanceof AuraJoseError
}

export const isInvalidSecretError = (error: unknown): error is InvalidSecretError => {
    return error instanceof InvalidSecretError
}

export const isFalsy = (value: unknown): boolean => {
    return value === null || value === undefined || value === false || value === 0 || value === "" || Number.isNaN(value)
}

export const isInvalidPayload = (payload: unknown): boolean => {
    return (
        isFalsy(payload) ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        (typeof payload === "object" && payload !== null && !Array.isArray(payload) && Object.keys(payload).length === 0)
    )
}
