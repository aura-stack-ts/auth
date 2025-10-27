export const getSecret = () => {
    const SECRET = process.env.AURA_STACK_SECRET
    if (!SECRET) {
        throw new Error("AURA_STACK_SECRET is not set")
    }
    return new TextEncoder().encode(SECRET)
}
