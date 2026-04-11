import { Elysia } from "elysia"
import { toHandler, withAuth } from "@/lib/auth"

const app = new Elysia()

app.get("/", () => "Welcome to the Aura Auth Elysia App!")

app.all("/api/auth/*", toHandler)

app.derive(withAuth).get("/api/protected", (ctx) => {
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
