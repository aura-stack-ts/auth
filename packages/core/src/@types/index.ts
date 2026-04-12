import { z } from "zod/v4"
import { OAuthEnvSchema } from "@/schemas.ts"
import type { JWTPayload } from "@/jose.ts"
import type { Prettify } from "@/@types/utility.ts"
import type { ClientOptions } from "@aura-stack/router"
import type { createAuthInstance } from "@/createAuth.ts"

export type { TypedJWTPayload } from "@aura-stack/jose"

export type * from "@/@types/config.ts"
export type * from "@/@types/errors.ts"
export type * from "@/@types/oauth.ts"
export type * from "@/@types/session.ts"
export type * from "@/@types/utility.ts"
export type { UserIdentityType, UserShape } from "@/shared/identity.ts"
/**
 * Standard JWT claims that are managed internally by the token system.
 * These fields are typically filtered out before returning user data.
 * @deprecated
 */
export type JWTStandardClaims = Pick<JWTPayload, "exp" | "iat" | "jti" | "nbf" | "sub" | "aud" | "iss">

/**
 * JWT payload structure that includes a mandatory `token` field used to verify CSRF Tokens
 */
export type JWTPayloadWithToken = JWTPayload & { token: string }

export type OAuthEnv = z.infer<typeof OAuthEnvSchema>

export type AuthClient = ReturnType<typeof createAuthInstance>["handlers"]

export type AuthClientOptions = Prettify<
    Omit<ClientOptions, "baseURL"> & {
        baseURL?: string
    }
>
