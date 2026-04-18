import type { ComponentProps } from "react"

export interface ButtonProps extends ComponentProps<"button"> {
    variant?: "default" | "outline" | "secondary"
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
    asChild?: boolean
}
