import type { Session } from "@aura-stack/auth/types"
import type { ComponentProps, PropsWithChildren } from "react"

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}

export interface ButtonProps extends ComponentProps<"button"> {
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
    asChild?: boolean
}
