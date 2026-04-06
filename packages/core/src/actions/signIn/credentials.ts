import { createEndpoint, HeadersBuilder } from "@aura-stack/router"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/security.ts"
import { cacheControl } from "@/shared/headers.ts"
import { AuthInternalError, AuthSecurityError } from "@/shared/errors.ts"

/**
 * Handles the credentials-based sign-in flow.
 * It extracts credentials from the request body, calls the provider's `authorize` function,
 * validates the returned user object, and creates a session.
 *
 * @returns The signed-in user and session cookies.
 */
export const signInCredentialsAction = createEndpoint("POST", "/signIn/credentials", async (ctx) => {
    const { request, context } = ctx
    const { credentials: provider, sessionStrategy, cookies, jose, logger, identity } = context

    if (!provider) {
        throw new AuthInternalError("CREDENTIALS_PROVIDER_NOT_CONFIGURED", "The credentials provider is not configured.")
    }

    let body: Record<string, string>
    try {
        body = await request.clone().json()
    } catch {
        throw new AuthSecurityError("INVALID_REQUEST_BODY", "The request body must be a valid JSON object.")
    }

    const user = await provider.authorize(
        {
            credentials: body,
            hash: hashPassword,
            verify: verifyPassword,
        },
        request
    )

    if (!user) {
        logger?.log("INVALID_CREDENTIALS", {
            severity: "warning",
            structuredData: {
                path: "/signIn/credentials",
            },
        })
        return Response.json({ error: "Invalid credentials" }, { status: 401 })
    }

    let validatedUser = user as any
    if (!identity.skipValidation) {
        const result = identity.schema.safeParse(user)
        if (!result.success) {
            logger?.log("IDENTITY_VALIDATION_FAILED", {
                severity: "error",
                structuredData: {
                    error: result.error.message.slice(0, 100),
                },
            })
            throw new AuthInternalError(
                "IDENTITY_VALIDATION_FAILED",
                "User data returned from credentials provider failed validation."
            )
        }
        validatedUser = result.data
    }

    const session = await sessionStrategy.createSession(validatedUser as any)
    const csrfToken = await createCSRF(jose)

    logger?.log("CREDENTIALS_SIGN_IN_SUCCESS", {
        severity: "info",
        structuredData: {
            user_id: String((validatedUser as any).sub || "unknown"),
        },
    })

    const headers = new HeadersBuilder(cacheControl)
        .setCookie(cookies.sessionToken.name, session, cookies.sessionToken.attributes)
        .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
        .toHeaders()

    return Response.json({ success: true, user: validatedUser }, { status: 200, headers })
})
