import express, { type Express, type Request, type Response } from "express"
import { authMiddleware } from "./middleware/auth.js"
import { withAuth } from "./middleware/with-auth.js"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.all("/api/auth/*", authMiddleware)

app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" })
})

app.get("/api/protected", withAuth, (_req: Request, res: Response) => {
    res.json({
        message: "You have access to this protected resource.",
        session: res.locals.session,
    })
})

const PORT = process.env.PORT ?? 8080

app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
    console.log(`✓ Auth routes available at http://localhost:${PORT}/api/auth`)
})

export { app }
