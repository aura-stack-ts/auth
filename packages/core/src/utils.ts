import crypto from "node:crypto"

export const generateSecure = (length: number = 32) => {
    return crypto.randomBytes(length).toString("base64")
}

export const toSnakeCase = (str: string) => {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase()
        .replace(/^_+/, "")
}

export const toCastCase = (obj: Record<string, any>) => {
    return Object.entries(obj).reduce((previous, [key, value]) => ({ ...previous, [toSnakeCase(key)]: value }), {})
}

export const createRedirectURI = (requestURL: string, oauth: string) => {
    const url = new URL(requestURL)
    return `${url.origin}/auth/callback/${oauth}`
}

export const equals = (a: string | undefined | null, b: string | undefined | null) => {
    if (a === null || b === null || a === undefined || b === undefined) return false
    return a === b
}

export const pick = <Obj extends Record<string, unknown>, Keys extends keyof Obj>(object: Obj, keys: Keys[]) => {
    return keys.reduce(
        (previous, key) => ({
            ...previous,
            [key]: object[key],
        }),
        {}
    ) as Pick<Obj, Keys>
}
