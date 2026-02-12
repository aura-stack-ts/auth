const LIMIT_LINES = 30

export const Lines = () => {
    return Array.from({ length: LIMIT_LINES }).map((_, i) => (
        <span
            key={i}
            className="h-px w-[200%] block border-t border-dashed border-border absolute top-0 left-0 origin-top-left rotate-10"
            style={{ top: `${i * 30}vh` }}
        ></span>
    ))
}
