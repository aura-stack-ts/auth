export type Prettify<T> = { [K in keyof T]: T[K] } & { __aura_auth_prettify_brand?: never }

export type LiteralUnion<T extends U, U = string> = (T | (U & Record<never, never>)) & {
	__aura_auth_literal_union_brand?: never
}
