import express, { type Express } from "express"
import { createAuth } from "@/createAuth.ts"

const app: Express = express()
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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", auth.toHandler)
app.get("/api/protected", auth.withAuth, (_, res) => {
    if (!res.locals.session) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    return res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

export { app }
