import { SectionProps } from "@/lib/@types/props"
import { FlickeringGrid } from "@/ui/flickering-grid"

export const SectionHeader = ({ title, description }: SectionProps) => {
    return (
        <div className=" w-full px-6 py-16 text-left relative overflow-hidden border-b border-border rounded-lg bg-background">
            <h3 className="text-3xl text-primary font-semibold tracking-wider">{title}</h3>
            <p className="mt-2 text-base font-medium tracking-wider text-primary-foreground">{description}</p>
            <FlickeringGrid
                className="absolute inset-0 z-0 mask-[linear-gradient(to_bottom,white,transparent)]"
                squareSize={4}
                gridGap={4}
                color="#F3F4F6"
                maxOpacity={0.2}
                flickerChance={0.1}
            />
        </div>
    )
}
