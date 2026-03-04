import { handlers, server } from "../_shared/auth.ts"

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import "@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname
    switch (pathname) {
        case "/":
            return new Response("Welcome to the Aura Auth Supabase App!")
        case "/api/protected": {
            const session = await server.getSession(request)
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
                session: session.session,
            })
        }
        default: {
            if (!pathname.startsWith("/api/auth")) {
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
