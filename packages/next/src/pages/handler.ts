import type { NextApiRequest, NextApiResponse } from "next"
import type { AuthInstance, User } from "@aura-stack/react"

const getBaseURL = (request: NextApiRequest) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
}

export const setResponseHeaders = (res: NextApiResponse, headers: Headers) => {
    for (const [key, value] of headers.entries()) {
        if (key.toLowerCase() === "set-cookie") {
            res.setHeader("Set-Cookie", headers.getSetCookie())
        } else {
            res.setHeader(key, value)
        }
    }
}

/**
 * Converts a set of Web Fetch API handlers into a Next.js API route handler.
 * This allows you to write your API route logic using the Web Fetch API and
 * have it seamlessly integrate with Next.js.
 *
 * > This function is designed to be used in the Pages Router.
 *
 * @param handlers The HTTP handlers to use for the API routes.
 * @returns A Next.js API route handler that wraps the provided handlers and translates between Next.js and Web Fetch APIs.
 * @example
 * import { handlers } from "@/lib/auth"
 *
 * export default toHandler(handlers)
 */
export const toHandler = <DefaultUser extends User = User>(handlers: AuthInstance<DefaultUser>["handlers"]) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const method = req.method ?? "GET"
        const handler = handlers[method as keyof typeof handlers]
        if (!handler) {
            return res.status(405).json({ error: `Method ${method} Not Allowed` })
        }
        const url = new URL(req.url!, getBaseURL(req))
        const webRequest = new Request(url, {
            method,
            headers: new Headers(req.headers as Record<string, string>),
            body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
        })
        try {
            const response = await handler(webRequest)
            if (response.status >= 300 && response.status < 400) {
                /**
                 * Next.js Pages Router can't manage redirections and json responses at the same time,
                 * so if the response is a redirection, we need to remove the Location header and manage the redirection manually.
                 */
                if (!req.url?.includes("/auth/signIn/") && !req.url?.includes("/auth/callback/")) {
                    response.headers.delete("Location")
                }
            }
            setResponseHeaders(res, response.headers)
            const data = await response.json()
            return res.status(response.status).json(data)
        } catch {
            return res.status(500).json({ error: "Internal Server Error" })
        }
    }
}
