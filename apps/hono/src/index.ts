import { Hono } from "hono"
import { toHonoHandler } from "./lib/handler"
import { withAuth } from "./middleware/with-auth"

const app = new Hono()

app.get("/", (ctx) => {
    return ctx.text("Welcome to the Aura Auth Hono App!")
})

app.all("/api/auth/*", toHonoHandler)

app.get("/api/protected", withAuth, (ctx) => {
    const session = ctx.get("session")
    return ctx.json({
        message: "You have access to this protected resource.",
        session,
    })
})

export default app
