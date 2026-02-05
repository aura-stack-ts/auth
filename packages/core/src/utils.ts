import { isInvalidZodSchemaError, isRouterError, RouterConfig } from "@aura-stack/router"
import { isAuthInternalError, isAuthSecurityError, isOAuthProtocolError } from "@/errors.js"
import type { ZodError } from "zod"
import type { APIErrorMap, InternalLogger } from "@/@types/index.js"

export const toSnakeCase = (str: string) => {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase()
        .replace(/^_+/, "")
}

export const toUpperCase = (str: string) => {
    return str.toUpperCase()
}

export const toCastCase = <Obj extends Record<string, string>, Type extends "snake" | "upper">(
    obj: Obj,
    type: Type = "snake" as Type
) => {
    return Object.entries(obj).reduce((previous, [key, value]) => {
        const newKey = type === "snake" ? toSnakeCase(key) : toUpperCase(key)
        return { ...previous, [newKey]: value }
    }, {}) as Type extends "snake"
        ? { [K in keyof Obj as `${string & K}`]: Obj[K] }
        : { [K in keyof Obj as Uppercase<string & K>]: Obj[K] }
}

export const equals = (a: string | number | undefined | null, b: string | number | undefined | null) => {
    if (a === null || b === null || a === undefined || b === undefined) return false
    return a === b
}

export const createErrorHandler = (logger?: InternalLogger): RouterConfig["onError"] => {
    return (error) => {
        if (isRouterError(error)) {
            const { message, status, statusText } = error
            logger?.log("ROUTER_INTERNAL_ERROR")
            return Response.json({ type: "ROUTER_ERROR", code: "ROUTER_INTERNAL_ERROR", message }, { status, statusText })
        }
        if (isInvalidZodSchemaError(error)) {
            logger?.log("INVALID_REQUEST")
            return Response.json({ type: "ROUTER_ERROR", code: "INVALID_REQUEST", message: error.errors }, { status: 422 })
        }
        if (isOAuthProtocolError(error)) {
            const { error: errorCode, message, type, errorURI } = error
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    error: errorCode,
                    error_description: message,
                    error_uri: errorURI ?? "",
                },
            })
            return Response.json(
                {
                    type,
                    message: message,
                },
                { status: 400 }
            )
        }
        if (isAuthInternalError(error)) {
            const { type, code, message } = error
            logger?.log("INVALID_OAUTH_CONFIGURATION", {
                structuredData: {
                    error: code,
                    error_description: message,
                },
            })
            return Response.json(
                {
                    type,
                    message,
                },
                { status: 400 }
            )
        }
        if (isAuthSecurityError(error)) {
            const { type, code, message } = error
            logger?.log("INVALID_OAUTH_CONFIGURATION", {
                structuredData: {
                    error: code,
                    error_description: message,
                },
            })
            return Response.json(
                {
                    type,
                    message,
                },
                { status: 400 }
            )
        }
        logger?.log("SERVER_ERROR")
        return Response.json(
            { type: "SERVER_ERROR", code: "SERVER_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}

export const getBaseURL = (request: Request) => {
    const url = new URL(request.url)
    return `${url.origin}${url.pathname}`
}

export const toISOString = (date: Date | string | number): string => {
    return new Date(date).toISOString()
}

export const useSecureCookies = (request: Request, trustedProxyHeaders: boolean): boolean => {
    return trustedProxyHeaders
        ? request.url.startsWith("https://") ||
              request.headers.get("X-Forwarded-Proto") === "https" ||
              (request.headers.get("Forwarded")?.includes("proto=https") ?? false)
        : request.url.startsWith("https://")
}

export const formatZodError = <T extends Record<string, unknown> = Record<string, unknown>>(error: ZodError<T>): APIErrorMap => {
    if (!error.issues || error.issues.length === 0) {
        return {}
    }
    return error.issues.reduce((previous, issue) => {
        const key = issue.path.join(".")
        return {
            ...previous,
            [key]: {
                code: issue.code,
                message: issue.message,
            },
        }
    }, {})
}

export const extractPath = (url: string): string => {
    const pathRegex = /^https?:\/\/[a-zA-Z0-9_\-\.]+(:\d+)?(\/.*)$/
    const match = url.match(pathRegex)
    return match && match[2] ? match[2] : "/"
}

export const createStructuredData = (data: Record<string, string | number | boolean>, sdID = "metadata"): string => {
    const entries = Object.entries(data)
    if (entries.length === 0) return `[${sdID}]`
    const values = entries.map(([key, value]) => `${key}="${String(value).replace(/(["\\\]])/g, "\\$1")}"`).join(" ")
    return `[${sdID} ${values}]`
}

export const getErrorName = (error: unknown): string => {
    if (error instanceof Error) {
        return error.name
    }
    return typeof error === "string" ? error : "UnknownError"
}
