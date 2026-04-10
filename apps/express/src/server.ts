import express, { type Express, type Response } from "express"
import { toHandler } from "@/lib/auth.js"
import { withAuth } from "@aura-stack/express"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", toHandler)

app.get("/api/protected", withAuth, (_: any, res: Response) => {
    res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

export { app }
