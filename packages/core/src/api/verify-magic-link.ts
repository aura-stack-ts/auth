import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/exports/crypto.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { VerifyMagicLinkAPIOptions, VerifyMagicLinkAPIReturn } from "@/@types/api.ts"

export const verifyMagicLink = async (
    token: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
        fallbackRedirectTo = undefined,
    }: FunctionAPIContext<VerifyMagicLinkAPIOptions>
): Promise<VerifyMagicLinkAPIReturn> => {
    const { logger, session } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("VERIFY_MAGIC_LINK_INITIATED")
        const { request, rateLimit, cookieStore } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/signIn/magicLink/verify")
            .verifyRateLimit("verifyMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit
        }

        const { sessionToken } = await session.strategy.verifyMagicLink({ token, request })
        logger?.log("VERIFY_MAGIC_LINK_SUCCESS")

        const csrfToken = await createCSRF(ctx.jose.instance)
        const builder = new HeadersBuilder(headers)
            .setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes)
            .setCookie(cookieStore.sessionToken.name, sessionToken, cookieStore.sessionToken.attributes)

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers: builder,
            fallbackRedirectTo,
        })
        return toAPIResponse<VerifyMagicLinkAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers: builder.toHeaders(),
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "VERIFY_MAGIC_LINK_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "VERIFY_MAGIC_LINK_ERROR",
            "An error occurred while verifying the magic link."
        )

        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<VerifyMagicLinkAPIReturn>({
            success: false,
            silent: { error: errors },
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            status: statusCode,
        })
    }
}
