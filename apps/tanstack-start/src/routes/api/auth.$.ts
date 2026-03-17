import { handlers } from "@/auth"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/auth/$")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                return await handlers.GET(request)
            },
            POST: async ({ request }) => {
                return await handlers.POST(request)
            },
        },
    },
})
