export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: any })[]) {
    return inputs
        .flat()
        .filter(Boolean)
        .map((x) => {
            if (typeof x === "string") return x
            if (typeof x === "object") {
                return Object.entries(x!)
                    .filter(([_, value]) => Boolean(value))
                    .map(([key]) => key)
                    .join(" ")
            }
            return ""
        })
        .join(" ")
        .trim()
}
