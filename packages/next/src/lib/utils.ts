export const isPagesRouter = () => {
    try {
        ;(async () => {
            await import("next/headers")
        })()
        return true
    } catch {
        return false
    }
}
