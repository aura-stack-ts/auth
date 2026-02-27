import { handlers } from "./auth"
import { getSession } from "./lib/get-session"

Bun.serve({
    port: 3000,
    routes: {
        "/": async () => {
            return new Response("Welcome to the Aura Stack Bun App!")
        },
        "/api/auth/*": async (request) => {
            const handler = handlers[request.method as keyof typeof handlers]
            if (!handler) {
                return new Response("Method not allowed", { status: 405 })
            }
            const response = await handler(request)
            return response
        },
        "/api/protected": async (request) => {
            const session = await getSession(request)
            return Response.json({
                message: "You have access to this protected resource.",
                session,
            })
        },
    },
})
