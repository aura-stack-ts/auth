import { Elysia } from "elysia"
import { toElysiaHandler } from "./lib/handler"
import { withAuthPlugin } from "./plugins/with-auth"

const app = new Elysia()

app.get("/", () => "Welcome to the Aura Auth Elysia App!")

app.all("/api/auth/*", toElysiaHandler)

app.use(withAuthPlugin).get("/api/protected", (ctx) => {
    if (!ctx.session) {
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
        session: ctx?.session,
    })
})

app.listen(3000)
