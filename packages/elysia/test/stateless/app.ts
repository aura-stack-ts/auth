import { Elysia } from "elysia"
import { createAuth } from "@/createAuth"

export const auth = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    credentials: {
        authorize: (ctx) => {
            if (ctx.credentials.password === "invalid") {
                return null
            }
            return {
                sub: "1234567890",
                name: "John Doe",
                email: "johndoe@example.com",
            }
        },
    },
})

export const app = new Elysia()

app.all("/api/auth/*", auth.toHandler)

app.derive(auth.withAuth).get("/api/protected", ({ session }) => {
    if (!session) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        })
    }
    return {
        message: "You have access to this protected resource.",
        session,
    }
})
