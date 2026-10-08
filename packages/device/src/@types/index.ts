export type * from "@/@types/device.ts"
export type * from "@/@types/config.ts"
export type * from "@/@types/session.ts"

/** Expands intersection types into a single flat object type for readable editor hints. */
export type Prettify<T> = { [K in keyof T]: T[K] }

/**
 * A string that must be one of the literals in `T`, or any other string (`U`).
 * Useful for autocomplete on known keys while still allowing custom values.
 */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)
