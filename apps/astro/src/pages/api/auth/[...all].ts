import { handlers } from "@/auth"
import type { APIRoute } from "astro"

export const GET: APIRoute = async ({ request }) => {
    return await handlers.GET(request)
}

export const POST: APIRoute = async ({ request }) => {
    return await handlers.POST(request)
}
