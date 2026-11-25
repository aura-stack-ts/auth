import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/exports/crypto.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async (
    context: FunctionAPIContext<SignInCredentialsAPIOptions>
): Promise<SignInCredentialsAPIReturn> => {
    const { credentials, logger, session: sessionConfig } = context.ctx
    const headers = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, cookieStore } = await createValidation(context)
            .buildRequest("/signIn/credentials")
            .verifyRateLimit("signInCredentials")
            .verifyCSRFToken(true)
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        let session: Record<string, unknown> = {}
        try {
            session = await credentials?.authorize({
                credentials: context.payload,
                deriveSecret: credentials?.hash ?? hashPassword,
                verifySecret: credentials?.verify ?? verifyPassword,
            })
        } catch {
            throw new AuraAuthError({ code: "AUTHORIZE_FAILED" })
        }
        if (!session) {
            throw new AuraAuthError({ code: "AUTH_CREDENTIALS_INVALID" })
        }
        const sessionToken = await sessionConfig.strategy.signInCredentials({
            request,
            payload: session,
            cookieStore,
        })
        const csrfToken = await createCSRF(context.ctx.jose.instance)
        logger?.log("CREDENTIALS_SIGN_IN_SUCCESS")

        const builder = new HeadersBuilder(headers)
            .setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes)
            .setCookie(cookieStore.sessionToken.name, sessionToken, cookieStore.sessionToken.attributes)

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            request,
            headers: builder,
        })

        const toHeaders = builder.toHeaders()
        return toAPIResponse<SignInCredentialsAPIReturn>({
            success: true,
            headers: toHeaders,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        const outHeaders = getAuraAuthHeaders(error, headers)
        errorToLogMessage(error, "SIGN_IN_CREDENTIALS_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "CREDENTIALS_SIGN_IN_ERROR",
            "An error occurred during credentials sign-in.",
            401
        )
        return toAPIResponse<SignInCredentialsAPIReturn>({
            success: false,
            silent: { error: errors },
            headers: outHeaders,
            redirect: false,
            redirectURL: null,
            status: statusCode,
        })
    }
}
