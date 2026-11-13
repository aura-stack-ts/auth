import type { InferSchema, Prettify } from "@aura-stack/router"
import type { SchemaTypes } from "@/identity/index.ts"
import type { AuthInstance } from "@/@types/config.ts"
import type { Session, User } from "@/@types/session.ts"

export type { Prettify }

/**
 * A string that must be one of the literals in `T`, or any other string (`U`).
 * Useful for autocomplete on known keys while still allowing custom values.
 */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/** Merges type `B` over `A`, replacing overlapping keys with `B`. */
export type Merge<A, B> = Omit<A, keyof B> & B

/** Recursively makes every property optional. */
export type DeepPartial<T> = T extends (...args: any[]) => any
    ? T
    : T extends object
      ? {
            [P in keyof T]?: DeepPartial<T[P]>
        }
      : T

/** Wraps a type in an object with the same keys. */
export type Wrap<T> = T extends any ? { [K in keyof T]: T[K] } : never

/**
 * Infers the user type from an {@link AuthInstance} config, or falls back to {@link User}.
 * @example
 * const auth = createAuth({
 *   identity: UserIdentity.extend({
 *     role: z.string().nullable().optional(),
 *     username: z.string().optional(),
 *   })
 * })
 *
 * type User = InferUser<typeof auth>
 */
export type InferUser<Config> =
    Config extends AuthInstance<infer Identity, infer _>
        ? Prettify<Merge<Identity, {}>>
        : Config extends { core: infer Core }
          ? Core extends AuthInstance<infer Identity, infer _>
              ? Prettify<Merge<Identity, {}>>
              : User
          : User

/**
 * Infers the session type from an {@link AuthInstance} config.
 * @example
 * const auth = createAuth({
 *   identity: UserIdentity.extend({
 *     role: z.string().nullable().optional(),
 *     username: z.string().optional(),
 *   })
 * })
 *
 * type Session = InferSession<typeof auth>
 */
export type InferSession<Config> = Prettify<Session<InferUser<Config>>>

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
export type UserFrom<T extends SchemaTypes> = Prettify<RemoveIndexSignature<InferSchema<T>>>

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
export type SessionFrom<T extends SchemaTypes> = Wrap<Session<Merge<UserFrom<T>, User>>>

/**
 * Infers the sign-up data type from an {@link AuthInstance} config's `signUp.schema`. It supports
 * Zod, Valibot and ArkType schemas.
 *
 * > For TypeBox its recommended to use the `Static` utility type directly to infer the schema.
 *
 * @example
 * const auth = createAuth({
 *   signUp: {
 *     schema: z.object({
 *       username: z.string(),
 *       nickname: z.string(),
 *       password: z.string(),
 *     })
 *   }
 * })
 *
 * type SignUp = InferSignUp<typeof auth>
 */
export type InferSignUp<Config> =
    Config extends AuthInstance<infer _, infer SignUpSchema>
        ? Prettify<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>
        : Record<string, any>

export type RemoveIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K]
}
