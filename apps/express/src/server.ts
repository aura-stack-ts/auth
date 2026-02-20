import express, { type Express, type Response } from "express"
import { verifySession } from "@/lib/verify-session.js"
import { toExpressHandler } from "@/middlewares/auth.js"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", toExpressHandler)

app.get("/api/protected", verifySession, (_, res: Response) => {
    res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

export { app }
