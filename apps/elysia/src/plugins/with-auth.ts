import { Elysia } from "elysia"
import { api } from "../auth"

export const withAuthPlugin = new Elysia({ name: "with-auth" })
    .resolve({ as: "scoped" }, async (ctx) => {
        try {
            const session = await api.getSession({
                headers: ctx.request.headers,
            })
            if (!session!.authenticated) {
                return { session: null }
            }
            return { session }
        } catch {
            return { session: null }
        }
    })
    .get("/api/auth/me", ({ session }) => session)
