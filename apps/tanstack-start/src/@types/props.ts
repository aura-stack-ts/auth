import type { LucideIcon } from "lucide-react"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"

export interface SignInProps {
    identity: BuiltInOAuthProvider
}

export interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}
