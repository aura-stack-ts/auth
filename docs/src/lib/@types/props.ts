import type { ComponentPropsWithoutRef, ReactNode } from "react"

export interface SectionProps {
    title: string
    description: string
}

export interface AnimatedShinyTextProps {
    children: ReactNode
    className?: string
    shimmerWidth?: number
}

export interface RippleProps extends ComponentPropsWithoutRef<"div"> {
    mainCircleSize?: number
    mainCircleOpacity?: number
    numCircles?: number
}

export interface MeteorsProps {
    number?: number
    minDelay?: number
    maxDelay?: number
    minDuration?: number
    maxDuration?: number
    angle?: number
    className?: string
}
