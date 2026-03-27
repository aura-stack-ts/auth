import type { ZodObject, ZodRawShape, ZodTypeAny } from "zod"

export type Prettify<T> = { [K in keyof T]: T[K] }

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

export type EditableShape<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodObject<infer Inner extends ZodRawShape> ? ZodObject<EditableShape<Inner>> : ZodTypeAny
}
