import express, { type Express } from "express"
import { createAuth } from "@/createAuth.ts"

const app: Express = express()
export const auth = createAuth({ oauth: ["github"], basePath: "/api/auth" })

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", auth.toHandler)
app.get("/api/protected", auth.withAuth, (_, res) => {
    if (!res.locals.session) {
        res.status(401).json({ message: "Unauthorized" })
    }
    res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

export { app }
