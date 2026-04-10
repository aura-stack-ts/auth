import { Hono } from "hono"
import { createAuth } from "@/createAuth"

export const app = new Hono()

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

app.all("/api/auth/*", auth.toHandler)

app.get("/api/protected", auth.withAuth, (c) => {
    const session = c.get("session")
    if (!session) {
        return c.json({ message: "Unauthorized" }, 401)
    }
    return c.json({
        message: "You have access to this protected resource.",
        session,
    })
})
