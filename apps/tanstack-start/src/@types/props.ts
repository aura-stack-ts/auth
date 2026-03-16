import type { PropsWithChildren } from "react"
import type { Session } from "@aura-stack/auth"

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}
