import type { Request, Response, NextFunction } from "express"
import { handlers } from "@/auth.js"

const splitSetCookieHeaderValue = (value: string): string[] => {
    return value
        .split(/,(?=\s*[^;,\s]+=)/g)
        .map((cookie) => cookie.trim())
        .filter(Boolean)
}

/**
 * Convert an Express Request to a Web API Request so it can be handled
 * by the framework-agnostic Aura Auth handlers.
 */
export const toWebRequest = (req: Request): globalThis.Request => {
    const method = req.method ?? "GET"
    const protocol = req.protocol ?? "http"
    const host = req.get("host") ?? "localhost"

    const baseURL = `${protocol}://${host}`
    const url = new URL(req.originalUrl ?? req.url, baseURL)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v)
        } else if (value !== undefined) {
            headers.set(key, value)
        }
    }

    const body = method !== "GET" && method !== "HEAD" ? JSON.stringify(req.body) : undefined
    if (body !== undefined) {
        headers.set("content-type", "application/json")
    }

    return new globalThis.Request(url, {
        method,
        headers,
        body,
    })
}

/**
 * Forward the Web API Response back to the Express Response.
 * Handles redirects, multiple Set-Cookie headers, and JSON/text bodies.
 */
export const toExpressResponse = async (webResponse: globalThis.Response, res: Response) => {
    for (const [key, value] of webResponse.headers.entries()) {
        if (key.toLowerCase() === "set-cookie") {
            const cookies = webResponse.headers.getSetCookie?.() ?? splitSetCookieHeaderValue(value)

            for (const cookie of cookies) {
                res.append("Set-Cookie", cookie)
            }
        } else {
            res.setHeader(key, value)
        }
    }

    res.status(webResponse.status)
    if (webResponse.status >= 300 && webResponse.status < 400) {
        const location = webResponse.headers.get("location") ?? "/"
        return res.json({ message: "Redirecting", location })
    }
    const contentType = webResponse.headers.get("content-type")
    if (contentType?.includes("application/json")) {
        const data = await webResponse.json()
        return res.json(data)
    }
    const text = await webResponse.text()
    return res.send(text)
}

/**
 * Express middleware that bridges Aura Auth Web-API handlers to Express.
 * Mount this on the `basePath` configured in `createAuth()` (default: `/api/auth`).
 */
export const toExpressHandler = async (req: Request, res: Response, next: NextFunction) => {
    const handler = handlers[req.method as keyof typeof handlers]
    if (!handler) {
        return next()
    }
    try {
        const webRequest = toWebRequest(req)
        const webResponse = await handler(webRequest)
        return await toExpressResponse(webResponse, res)
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" })
    }
}
