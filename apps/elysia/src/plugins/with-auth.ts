import type { Session } from "@aura-stack/auth"
import { Elysia, type SingletonBase } from "elysia"
import { getSession } from "../lib/get-session"

export type ResolveSingleton = { resolve: { session: Session | null } } & Omit<SingletonBase, "resolve">

export const withAuthPlugin = new Elysia<"/", ResolveSingleton>({ name: "with-auth" })
.resolve(async (ctx) => {
    try {
        const session = await getSession(ctx)
        if (!session) {
            return { session: null }
        }
        return { session }
    } catch {
        return { session: null }
    }
})
.get("/api/auth/me", ({ session }) => session)