import { use, useCallback, useTransition } from "react"
import { AuthContext } from "@/context.tsx"
import type { User } from "@aura-stack/auth"
import type { Context } from "@/@types/types.ts"

export const useAssertContext = <DefaultUser extends User = User>() => {
    const ctx = use(AuthContext)
    if (ctx === undefined) {
        throw new Error("Auth hooks must be used within an <AuthProvider>.")
    }
    return ctx as Context<DefaultUser>
}

export const useAsyncAction = () => {
    const [isPending, startTransition] = useTransition()

    const execute = useCallback(<T>(action: () => Promise<T>): Promise<T> => {
        return new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const value = await action()
                    resolve(value)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }, [])

    return { execute, isPending } as const
}

export const performRedirect = async (redirect: ((url: string) => void | Promise<void>) | undefined, url?: string | null) => {
    if (!url) return
    if (redirect) {
        await redirect(url)
        return
    }
    window.location.assign(url)
}
