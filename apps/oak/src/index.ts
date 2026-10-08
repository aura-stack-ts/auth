import { Application, Router } from "@oak/oak"
import { withAuth, toHandler } from "@/lib/auth.ts"

const router = new Router()
const app = new Application()

router.get("/", (ctx) => {
    ctx.response.body = "Welcome to Aura Auth Oak App!"
})

router.all("/api/auth/(.*)", toHandler)

router.get("/api/protected", withAuth, (ctx) => {
    ctx.response.body = {
        message: "You have access to this protected resource.",
        session: ctx.state.session,
    }
})

app.use(router.routes())
await app.listen({ port: 3000 })
