export type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)
