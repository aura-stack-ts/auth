import type { AuthInstance } from "@aura-stack/react"

export const makeAuth = (apiOverrides: Partial<AuthInstance["api"]>): AuthInstance =>
    ({
        api: apiOverrides,
    }) as unknown as AuthInstance

export const responseHeaders = () =>
    ({
        getSetCookie: () => ["session_token=session-value; Path=/; HttpOnly"],
    }) as unknown as Headers
