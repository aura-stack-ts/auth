import { Elysia } from "elysia"
import { server } from "../auth"

export const withAuthPlugin = new Elysia({ name: "with-auth" })
    .resolve({ as: "scoped" }, async (ctx) => {
        try {
            const session = await server.getSession(ctx.request)
            if (!session!.authenticated) {
                return { session: null }
            }
            return { session }
        } catch {
            return { session: null }
        }
    })
    .get("/api/auth/me", ({ session }) => session)
