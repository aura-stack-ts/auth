/**
 * Public type entry for `@aura-stack/auth` and `@aura-stack/auth/types`: configuration, session, OAuth, API results, and utilities.
 */
export type * from "@/@types/config.ts"
export type * from "@/@types/oauth.ts"
export type * from "@/@types/oidc.ts"
export type * from "@/@types/session.ts"
export type * from "@/@types/utility.ts"
export type * from "@/@types/api.ts"
export type * from "@/@types/client.ts"
export type * from "@/@types/entities.ts"
export type * from "@/@types/adapter.ts"
export type * from "@/@types/identity.ts"

export type { TypedJWTPayload } from "@aura-stack/jose"
export type { Awaitable, RequestHeaders } from "@aura-stack/router/types"

export type { IdentityShape as ZodIdentitySchema, IsZod } from "@/identity/zod.ts"
export type { IdentityShape as ArkTypeIdentitySchema, IsArkType } from "@/identity/arktype.ts"
export type { IdentityShape as TypeboxIdentitySchema, IsTypeBox } from "@/identity/typebox.ts"
export type { IdentityShape as ValibotIdentitySchema, IsValibot } from "@/identity/valibot.ts"
