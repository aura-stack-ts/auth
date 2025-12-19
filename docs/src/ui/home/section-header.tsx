import { SectionProps } from "@/lib/@types/props"

export const SectionHeader = ({ title, description }: SectionProps) => {
    return (
        <div className="px-6 py-16 text-left border-b border-border">
            <h3 className="font-medium uppercase tracking-wider ">{title}</h3>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{description}</p>
        </div>
    )
}
