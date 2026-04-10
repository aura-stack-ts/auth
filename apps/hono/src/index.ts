import { Hono } from "hono"
import { toHandler, withAuth } from "@/lib/auth"

const app = new Hono()

app.get("/", (ctx) => {
    return ctx.text("Welcome to the Aura Auth Hono App!")
})

app.all("/api/auth/*", toHandler)

app.get("/api/protected", withAuth, (ctx) => {
    const session = ctx.get("session")
    if (!session) {
        return ctx.json({ message: "Unauthorized" }, 401)
    }

    return ctx.json({
        message: "You have access to this protected resource.",
        session,
    })
})

export default app
