import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/shared/crypto.ts"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    }: FunctionAPIContext<VerifyMagicLinkAPIOptions>
): Promise<VerifyMagicLinkAPIReturn> => {
    const { logger, sessionStrategy, cookies } = ctx
    try {
        logger?.log("VERIFY_MAGIC_LINK_INITIATED")
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/signIn/magicLink/verify")
            .verifyRateLimit("verifyMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit
        }

        const { success, sessionToken } = await sessionStrategy.verifyMagicLink({ token, request })
        logger?.log(success ? "VERIFY_MAGIC_LINK_SUCCESS" : "VERIFY_MAGIC_LINK_FAILED")
        const builder = new HeadersBuilder(secureApiHeaders)

        if (success) {
            const csrfToken = await createCSRF(ctx.jose)
            builder
                .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
                .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)
        }

        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, builder)
        return {
            success,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers: builder.toHeaders(),
            toResponse: () => {
                return Response.json(
                    {
                        success,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: builder.toHeaders(), status: success ? (redirect ? 302 : 200) : 200 }
                )
            },
        } as VerifyMagicLinkAPIReturn
    } catch (error) {
        errorToLogMessage(error, "VERIFY_MAGIC_LINK_ERROR", logger)
        const { errors, statusCode } = handleApiError(
            error,
            "VERIFY_MAGIC_LINK_ERROR",
            "An error occurred while verifying the magic link."
        )

        return {
            success: false,
            error: errors,
            redirect: false,
            redirectURL: null,
            headers: new Headers(secureApiHeaders),
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: secureApiHeaders, status: statusCode }
                )
            },
        }
    }
}
