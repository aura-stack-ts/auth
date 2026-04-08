import { AuthValidationError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/security.ts"
import { HeadersBuilder } from "@aura-stack/router"
import type { SignInCredentialsOptions } from "@/@types/session.ts"

export const signInCredentials = async ({ ctx, payload }: SignInCredentialsOptions) => {
    const { cookies, credentials, sessionStrategy, logger } = ctx
    try {
        const session = await credentials?.authorize({
            credentials: payload,
            deriveSecret: credentials?.hash ?? hashPassword,
            verifySecret: credentials?.verify ?? verifyPassword,
        })
        if (!session) {
            throw new AuthValidationError("INVALID_CREDENTIALS", "The provided credentials are invalid.")
        }
        const sessionToken = await sessionStrategy.createSession(session)
        const csrfToken = await createCSRF(ctx.jose)

        logger?.log("CREDENTIALS_SIGN_IN_SUCCESS")

        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)
            .toHeaders()
        return {
            success: true,
            headers,
        }
    } catch {
        logger?.log("INVALID_CREDENTIALS", {
            severity: "warning",
            structuredData: {
                path: "/signIn/credentials",
            },
        })
        return {
            success: false,
            headers: new Headers(secureApiHeaders),
        }
    }
}
