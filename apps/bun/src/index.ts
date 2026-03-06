import { handlers, api } from "./auth"

Bun.serve({
    port: 3000,
    routes: {
        "/": async () => {
            return new Response("Welcome to the Aura Stack Bun App!")
        },
        "/api/auth/*": async (request) => {
            const handler = handlers[request.method as keyof typeof handlers]
            if (!handler) {
                return Response.json({ error: "Method Not Allowed" }, { status: 405 })
            }
            const response = await handler(request)
            return response
        },
        "/api/protected": async (request) => {
            const session = await api.getSession({
                headers: request.headers,
            })
            if (!session.authenticated) {
                return Response.json(
                    {
                        error: "Unauthorized",
                        message: "Active session required.",
                    },
                    { status: 401 }
                )
            }

            return Response.json({
                message: "You have access to this protected resource.",
                session,
            })
        },
    },
})
