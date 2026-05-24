import type { AuthInstance, User } from "@aura-stack/react"
import { NextApiRequest, NextApiResponse } from "next"

const getBaseURL = (request: NextApiRequest) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
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
            body: method !== "GET" && req.body ? JSON.stringify(req.body) : undefined,
        })
        try {
            const response = await handler(webRequest)
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location")
                if (location) {
                    res.setHeaders(response.headers)
                    return res.redirect(response.status, location)
                }
            }
            res.setHeaders(response.headers)
            const data = await response.json()
            return res.status(response.status).json(data)
        } catch {
            return res.status(500).json({ error: "Internal Server Error" })
        }
    }
}
