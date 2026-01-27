import { handlers } from "@/auth"
import type { NextApiRequest, NextApiResponse } from "next"

const getBaseURL = (request: NextApiRequest) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
}

export const handler = async (request: NextApiRequest, response: NextApiResponse) => {
    const method = request.method ?? "GET"
    const handler = handlers[method as keyof typeof handlers]
    if (!handler) {
        response.status(405).json({ error: `Method ${method} Not Allowed` })
        return
    }
    const url = new URL(request.url!, getBaseURL(request))
    const toHandlerResponse = await handler(new Request(url, {
        method,
        headers: { ...request.headers as HeadersInit },
        body: request.method === "GET" ? undefined : request.body,
    }))
    const json = await toHandlerResponse.json()
    return response.json(json)
}

export default handler
