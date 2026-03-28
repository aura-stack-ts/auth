import type { ZodObject, ZodRawShape, ZodTypeAny, infer as Infer } from "zod"

export type Prettify<T> = { [K in keyof T]: T[K] }

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

export type EditableShape<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodObject<infer Inner extends ZodRawShape> ? ZodObject<EditableShape<Inner>> : ZodTypeAny
}

export type ShapeToObject<S extends ZodRawShape = ZodRawShape> = Prettify<{
    [K in keyof S]: Infer<S[K]>
}>

export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K]
}
