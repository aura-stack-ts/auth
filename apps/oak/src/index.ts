import { Application, Router } from "@oak/oak"
import { toOakHandler } from "./lib/handler.ts"
import { type GlobalState, withAuth } from "./middleware/with-auth.ts"

const router = new Router<GlobalState>()
const app = new Application()

router.get("/", (ctx) => {
    ctx.response.body = "Welcome to Aura Auth Oak App!"
})

router.all("/api/auth/(.*)", toOakHandler)

router.get("/api/protected", withAuth, (ctx) => {
    ctx.response.body = {
        message: "You have access to this protected resource.",
        session: ctx.state.session,
    }
})

app.use(router.routes())
await app.listen({ port: 3000 })
