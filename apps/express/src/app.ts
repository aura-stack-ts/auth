import express, { type Express } from "express"
import { toHandler, withAuth } from "@/lib/auth.js"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", toHandler)

app.get("/api/protected", withAuth, (_, res) => {
    if (!res.locals.session) {
        res.status(401).json({ message: "Unauthorized" })
    }
    res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

export { app }
