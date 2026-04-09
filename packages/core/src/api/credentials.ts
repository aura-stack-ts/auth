import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { AuthValidationError } from "@/shared/errors.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/security.ts"
import { createRedirectTo, getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { SignInCredentialsOptions, SignInCredentialsReturn } from "@/@types/session.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headerInit,
    redirectTo,
}: SignInCredentialsOptions): Promise<SignInCredentialsReturn> => {
    const { cookies, credentials, sessionStrategy, logger } = ctx
    try {
        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers: headerInit })
            const url = `${origin}${ctx.basePath}/signIn/credentials`
            request = new Request(url, { headers: headerInit })
        }
        await getOriginURL(request, ctx)

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
        const redirectURL = await createRedirectTo(request, redirectTo, ctx)

        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)
            .toHeaders()
        return {
            success: true,
            headers,
            redirectURL,
        }
    } catch (error) {
        if (error instanceof AuthValidationError) {
            logger?.log("INVALID_CREDENTIALS", {
                severity: "warning",
                structuredData: { path: "/signIn/credentials" },
            })
            return {
                success: false,
                headers: new Headers(secureApiHeaders),
                redirectURL: null,
            }
        }
        logger?.log("CREDENTIALS_SIGN_IN_FAILED", {
            severity: "error",
            structuredData: { path: "/signIn/credentials" },
        })
        return {
            success: false,
            headers: new Headers(secureApiHeaders),
            redirectURL: null,
        }
    }
}
