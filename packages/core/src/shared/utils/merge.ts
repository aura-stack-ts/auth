import { isObject } from "@/shared/assert.ts"

export const merge = <O extends Record<PropertyKey, unknown>>(origin: O, source: Record<PropertyKey, unknown> | undefined) => {
    const result: Record<PropertyKey, unknown> = { ...origin }
    for (const [key, value] of Object.entries(source ?? {})) {
        if (key === "__proto__") continue
        const base = origin[key]
        result[key] = isObject(value) && isObject(base) ? merge(base, value) : value
    }
    return result as O
}
