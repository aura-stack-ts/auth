import type { AuthInstance } from "@/@types/config.ts"
import type { Session, User, UserShape } from "@/@types/session.ts"
import type { ZodObject, ZodRawShape, ZodTypeAny, infer as Infer } from "zod/v4"
import type { ObjectSchema, BaseSchema, AnySchema as AnyValibotSchema, ObjectEntries, InferOutput } from "valibot"
import { UserShapeValibot } from "@/shared/identity.ts"

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

export type EditableShapeZod<T extends ZodRawShape> = EditableShape<T>

type AnyShape = Record<string, AnyValibotSchema>

export type EditableShapeValibot<T extends ObjectEntries> = {
    [K in keyof T]: T[K] extends ObjectSchema<infer Inner extends AnyShape, undefined>
        ? ObjectSchema<EditableShapeValibot<Inner>, undefined>
        : BaseSchema<any, any, any>
}

export type ConfigSchema<T extends EditableShape<UserShape> | EditableShapeValibot<UserShapeValibot>> =
    T extends EditableShape<UserShape>
        ? ZodObject<T & ZodRawShape>
        : T extends EditableShapeValibot<UserShapeValibot>
          ? ObjectSchema<T & ObjectEntries, undefined>
          : never

export type ValibotShapeToObject<S extends ObjectEntries> = Merge<InferOutput<ObjectSchema<S, undefined>>, User>

/** Merges type `B` over `A`, replacing overlapping keys with `B`. */
export type Merge<A, B> = Omit<A, keyof B> & B

/**
 * Infers the runtime object type from a Zod `shape` and intersects it with {@link User}
 * so identity fields always include the base user contract.
 */
export type ZodShapeToObject<S extends ZodRawShape = ZodRawShape> = Merge<Infer<ZodObject<S>>, User>

export type FromShapeToObject<S> = S extends ZodRawShape
    ? ZodShapeToObject<S>
    : S extends ObjectEntries
      ? ValibotShapeToObject<S>
      : never

/** Recursively makes every property required. */
export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K]
}

/** Recursively makes every property optional. */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
/** Wraps a type in an object with the same keys. */
export type Wrap<T> = T extends any ? { [K in keyof T]: T[K] } : never

/**
 * Infers the user type from an {@link AuthInstance} config, or falls back to {@link User}.
 * @example
 * const auth = createAuth({
 *   oauth: [],
 *   identity: UserIdentity.extend({
 *     role: z.string().nullable().optional(),
 *     username: z.string().optional(),
 *   })
 * })
 *
 * type User = InferUser<typeof auth>
 */
export type InferUser<Config extends AuthInstance> = Config extends AuthInstance<infer Identity> ? Prettify<Identity> : User

/**
 * Infers the session type from an {@link AuthInstance} config.
 * @example
 * const auth = createAuth({
 *   oauth: [],
 *   identity: UserIdentity.extend({
 *     role: z.string().nullable().optional(),
 *     username: z.string().optional(),
 *   })
 * })
 *
 * type Session = InferSession<typeof auth>
 */
export type InferSession<Config extends AuthInstance> = Prettify<Session<Wrap<InferUser<Config>>>>

/**
 * Shorthand for a Zod object’s `.shape` property.
 */
export type InferZodShape<T extends ZodObject> = T["shape"]

/**
 * Infers the user type from a Zod identity schema, or falls back to {@link User}.
 * @example
 * const schema = z.object({
 *   sub: z.string(),
 *   role: z.string().nullable().optional(),
 *   username: z.string().optional(),
 * })
 *
 * type User = UserFrom<typeof schema>
 */
export type UserFrom<T extends ZodObject> = Prettify<ZodShapeToObject<InferZodShape<T>>>

/**
 * Infers the session type from a Zod identity schema.
 * @example
 * const schema = z.object({
 *   sub: z.string(),
 *   role: z.string().nullable().optional(),
 *   username: z.string().optional(),
 * })
 *
 * type Session = SessionFrom<typeof schema>
 */
export type SessionFrom<T extends ZodObject> = Wrap<Session<Wrap<UserFrom<T>>>>

/**
 * HTTP `Response` with `json()` typed to resolve to `Body` (defaults to `unknown`).
 */
export type AuthResponse<Body = unknown> = Prettify<
    Omit<Response, "json"> & {
        json(): Promise<Body>
    }
>
