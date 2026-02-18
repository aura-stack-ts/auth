import type { Session } from "@aura-stack/auth"
import type { PropsWithChildren } from "react"

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}
