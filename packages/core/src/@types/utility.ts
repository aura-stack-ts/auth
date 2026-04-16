import type { User } from "@/@types/session.ts"
import type { AuthInstance } from "@/@types/config.ts"
import type { ZodObject, ZodRawShape, ZodTypeAny } from "zod/v4"
import type { z } from "zod/v4"

export type Prettify<T> = { [K in keyof T]: T[K] }

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

export type EditableShape<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodObject<infer Inner extends ZodRawShape> ? ZodObject<EditableShape<Inner>> : ZodTypeAny
}

export type Merge<A, B> = Omit<A, keyof B> & B

export type ShapeToObject<S extends ZodRawShape = ZodRawShape> = Merge<
    {
        [K in keyof S]: z.infer<S[K]>
    },
    User
>

export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K]
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type InferAuthIdentity<Config> = Config extends AuthInstance<infer Identity> ? Prettify<Identity> : User

export type InferShape<T extends ZodObject> = T["shape"]
export type InferIdentity<T extends ZodObject> = ShapeToObject<InferShape<T>>

export type AuthResponse<Body = any> = Prettify<
    Omit<Response, "json"> & {
        json(): Promise<Body>
    }
>
