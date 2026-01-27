import type { Session } from "@aura-stack/auth"
import type { ComponentProps, PropsWithChildren } from "react"

export interface ButtonProps extends ComponentProps<"button"> {
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
    asChild?: boolean
}

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}