import type { PropsWithChildren } from "react"
import type { LucideIcon } from "lucide-react"
import type { Session } from "@aura-stack/auth"

export interface SignInProps {
    id: string
    name: string
}

export interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}