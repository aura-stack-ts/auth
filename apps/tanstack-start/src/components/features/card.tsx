import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import type { ReactNode } from "react"

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

export const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn("group relative rounded-none shadow-zinc-950/5 bg-transparent", className)}>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
        {children}
    </Card>
)
