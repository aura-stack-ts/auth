import { handlers } from "@/auth"
import type { NextApiRequest, NextApiResponse } from "next"

const getBaseURL = (request: NextApiRequest) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
}

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

export default handler
