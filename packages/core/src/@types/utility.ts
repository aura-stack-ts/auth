import type { User } from "@/@types/session.ts"
import type { AuthInstance } from "@/@types/config.ts"
import type { ZodObject, ZodRawShape, ZodTypeAny } from "zod/v4"
import type { z } from "zod/v4"

/** Expands intersection types into a single flat object type for readable editor hints. */
export type Prettify<T> = { [K in keyof T]: T[K] }

/**
 * A string that must be one of the literals in `T`, or any other string (`U`).
 * Useful for autocomplete on known keys while still allowing custom values.
 */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/**
 * Transforms a Zod raw shape so nested `ZodObject` fields become editable (same structure, for config authoring).
 */
export type EditableShape<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodObject<infer Inner extends ZodRawShape> ? ZodObject<EditableShape<Inner>> : ZodTypeAny
}

/** Merges type `B` over `A`, replacing overlapping keys with `B`. */
export type Merge<A, B> = Omit<A, keyof B> & B

/**
 * Infers the runtime object type from a Zod `shape` and intersects it with {@link User}
 * so identity fields always include the base user contract.
 */
export type ShapeToObject<S extends ZodRawShape = ZodRawShape> = Merge<
    {
        [K in keyof S]: z.infer<S[K]>
    },
    User
>

/** Recursively makes every property required. */
export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K]
}

/** Recursively makes every property optional. */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Resolves the user identity type from an {@link AuthInstance} config, or falls back to {@link User}. */
export type InferAuthIdentity<Config> = Config extends AuthInstance<infer Identity> ? Prettify<Identity> : User

/** Shorthand for a Zod object’s `.shape` property. */
export type InferShape<T extends ZodObject> = T["shape"]

/** Runtime user object type inferred from a Zod identity schema. */
export type InferIdentity<T extends ZodObject> = ShapeToObject<InferShape<T>>

/**
 * HTTP `Response` with `json()` typed to resolve to `Body` (defaults to `unknown`).
 */
export type AuthResponse<Body = unknown> = Prettify<
    Omit<Response, "json"> & {
        json(): Promise<Body>
    }
>
