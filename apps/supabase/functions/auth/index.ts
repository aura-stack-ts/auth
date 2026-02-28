import { handlers } from "../_shared/auth.ts"
import { getSession } from "../_shared/get-session.ts"

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
            const session = await getSession(request)
            if (!session) {
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
