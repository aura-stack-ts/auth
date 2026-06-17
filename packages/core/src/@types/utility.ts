import { Type } from "arktype"
import type { TProperties, TObject, TSchema } from "typebox"
import type { AuthInstance } from "@/@types/config.ts"
import type { Session, User } from "@/@types/session.ts"
import type { ZodObject, ZodRawShape, ZodTypeAny, infer as Infer, ZodString, ZodOptional } from "zod/v4"
import type { Identities, IsArkType, IsZod, UserShapeTypeBox, UserShapeValibot } from "@/shared/identity.ts"
import type { ObjectSchema, BaseSchema, AnySchema as AnyValibotSchema, ObjectEntries, InferOutput } from "valibot"
import type { InferSchema } from "@aura-stack/router"

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

export type EditableShapeTypebox<T extends TProperties> = {
    [K in keyof T]: T[K] extends TObject ? Wrap<EditableShapeTypebox<T[K]["properties"]>> : TSchema
}

export type EditableUser = {
    [K in keyof User]: any
}

export type ConfigSchema<T extends Identities> =
    IsZod<T> extends true
        ? ZodObject<T & ZodRawShape>
        : T extends EditableShapeValibot<UserShapeValibot>
          ? ObjectSchema<T & ObjectEntries, undefined>
          : IsArkType<T> extends true
            ? T
            : T extends EditableShapeTypebox<UserShapeTypeBox>
              ? TObject<T & TProperties>
              : never

export type ValibotShapeToObject<S extends ObjectEntries> = Merge<InferOutput<ObjectSchema<S, undefined>>, User>

export type ArktypeShapeToObject<S extends Type> = S extends Type<infer Shape> ? Wrap<Merge<Shape, User>> : never

export type TypeboxShapeToObject<S> = Wrap<Merge<S, User>>

export type EditableShapeArkType<T extends Type> = T extends Type<infer Shape> ? Type<{ [K in keyof Shape]: any }> : never

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
      : S extends Type
        ? ArktypeShapeToObject<S>
        : S extends TProperties
          ? TypeboxShapeToObject<S>
          : S extends User
            ? S
            : never

export type EditableToSchema<T> =
    T extends EditableShape<infer S>
        ? ZodObject<S>
        : T extends EditableShapeValibot<infer S>
          ? ObjectSchema<S, undefined>
          : T extends EditableShapeTypebox<infer S>
            ? TObject<S>
            : T extends EditableShapeArkType<any>
              ? T
              : never

export type ReturnUpdateSessionShape<T> =
    T extends EditableShape<infer S>
        ? ZodObject<{ user?: ZodObject<S>; expires?: ZodOptional<ZodString> }>
        : T extends EditableShapeValibot<infer S>
          ? ObjectSchema<{ user?: ObjectSchema<S, undefined>; expires?: BaseSchema<any, any, any> }, undefined>
          : T extends EditableShapeArkType<any>
            ? Type<{ user?: T; expires?: Type<string> }>
            : T extends EditableShapeTypebox<infer S>
              ? TObject<{ user?: TObject<S>; expires?: TSchema }>
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
 * Infers the sign-up data type from an {@link AuthInstance} config's `signUp.schema`. It supports
 * Zod, Valibot and ArkType schemas.
 *
 * > For TypeBox its recommended to use the `Static` utility type directly to infer the schema.
 *
 * @example
 * const auth = createAuth({
 *   oauth: [],
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
export type InferSignUp<Config extends AuthInstance> =
    Config extends AuthInstance<infer _, infer SignUpSchema>
        ? Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>
        : Record<string, any>

export type RemoveIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K]
}

/**
 * HTTP `Response` with `json()` typed to resolve to `Body` (defaults to `unknown`).
 */
export type AuthResponse<Body = unknown> = Prettify<
    Omit<Response, "json"> & {
        json(): Promise<Body>
    }
>

export type RequiredKeys<Obj extends object, Keys extends keyof Obj = keyof Obj> = Wrap<
    {
        [K in Keys]-?: Obj[K]
    } & Omit<Obj, Keys>
>
