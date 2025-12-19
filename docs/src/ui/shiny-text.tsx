import clsx from "clsx"
import type { CSSProperties } from "react"
import type { AnimatedShinyTextProps } from "@/lib/@types/props"

export const AnimatedShinyText = ({ children, className, shimmerWidth = 100 }: AnimatedShinyTextProps) => {
    return (
        <p
            style={
                {
                    "--shiny-width": `${shimmerWidth}px`,
                } as CSSProperties
            }
            className={clsx(
                "mx-auto max-w-md text-primary-foreground/70 dark:text-primary-foreground/70",
                "animate-shiny-text bg-clip-text bg-no-repeat bg-position-[0_0] bg-size-[var(--shiny-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
                "bg-linear-to-r from-transparent via-black/80 via-50% to-transparent  dark:via-white/80",
                className
            )}
        >
            {children}
        </p>
    )
}
