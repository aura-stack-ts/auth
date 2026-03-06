import { handlers, api } from "./auth.ts"

Deno.serve({ port: 3000 }, async (request) => {
    const pathname = new URL(request.url).pathname
    switch (pathname) {
        case "/":
            return new Response("Welcome to the Aura Stack Deno App!")
        case "/api/protected": {
            const session = await api.getSession({
                headers: request.headers
            })
            if (!session.authenticated) {
                return Response.json(
                    {
                        error: "Unauthorized",
                        message: "Active session required.",
                    },
                    { status: 401 },
                )
            }
            return Response.json({
                message: "You have access to this protected resource.",
                session,
            })
        }
        default: {
            if(!pathname.startsWith("/api/auth")) {
                return Response.json({ error: "Not Found" }, { status: 404 })
            }
            const handler = handlers[request.method as keyof typeof handlers]
            if (!handler) {
                return Response.json({ error: "Method Not Allowed" }, { status: 405 })
            }
            return await handler(request)
        }
    }
})
