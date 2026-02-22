import { Elysia } from "elysia"
import { toElysiaHandler } from "./lib/handler"
import { withAuthPlugin } from "./plugins/with-auth"

const app = new Elysia()

app.get("/", () => "Welcome to the Aura Auth Elysia App!")

app.all("/api/auth/*", toElysiaHandler)

app
.use(withAuthPlugin)
.get("/api/protected", ({ session }) => {
    return Response.json({
        message: "You have access to this protected resource.",
        session,
    })
})


app.listen(3000)
