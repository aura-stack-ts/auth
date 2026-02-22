import { Elysia, type Context } from "elysia"
import { getSession } from "../lib/get-session"

export const withAuthPlugin = new Elysia({ name: "with-auth" })
    .resolve({ as: "scoped" }, async (ctx) => {
        try {
            const session = await getSession(ctx as Context)
            if (!session) {
                return { session: null }
            }
            return { session }
        } catch {
            return { session: null }
        }
    })
    .get("/api/auth/me", ({ session }) => session)
