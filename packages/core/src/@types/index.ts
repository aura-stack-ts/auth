/**
 * Public type entry for `@aura-stack/auth` and `@aura-stack/auth/types`: configuration, session, OAuth, API results, and utilities.
 */
import type { JWTPayload } from "@/jose.ts"
import type { Prettify } from "@/@types/utility.ts"
import type { ClientOptions } from "@aura-stack/router"
import type { createAuthInstance } from "@/createAuth.ts"

export type * from "@/@types/config.ts"
export type * from "@/@types/oauth.ts"
export type * from "@/@types/oidc.ts"
export type * from "@/@types/session.ts"
export type * from "@/@types/utility.ts"
export type * from "@/@types/api.ts"
export type * from "@/identity/index.ts"
export type * from "@/@types/entities.ts"
export type * from "@/@types/adapter.ts"

export type { Awaitable } from "@aura-stack/router/types"
export type { TypedJWTPayload } from "@aura-stack/jose"

export type { IdentityShape as ZodIdentitySchema } from "@/identity/zod.ts"
export type { IdentityShape as ArkTypeIdentitySchema } from "@/identity/arktype.ts"
export type { IdentityShape as TypeboxIdentitySchema } from "@/identity/typebox.ts"
export type { IdentityShape as ValibotIdentitySchema } from "@/identity/valibot.ts"

/**
 * JWT payload structure that includes a mandatory `token` field used to verify CSRF Tokens
 */
export type JWTPayloadWithToken = JWTPayload & { token: string }

/**
 * HTTP route handlers exposed by the auth instance (`GET`, `POST`, `PATCH`, `ALL`) for mounting on your app router.
 */
export type AuthClient = ReturnType<typeof createAuthInstance>["handlers"]

/**
 * Options for {@link createAuthClient} (browser HTTP client). Extends the router client with an optional `baseURL`
 * when the client runs outside the browser (e.g. server-side fetch to your app origin).
 */
export type AuthClientOptions = Prettify<
    Omit<ClientOptions, "baseURL"> & {
        baseURL?: string
    }
>
