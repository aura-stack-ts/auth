import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/exports/crypto.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
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
        fallbackRedirectTo = undefined,
    }: FunctionAPIContext<VerifyMagicLinkAPIOptions>
): Promise<VerifyMagicLinkAPIReturn> => {
    const { logger, session, cookies } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("VERIFY_MAGIC_LINK_INITIATED")
        const { request, rateLimit } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/signIn/magicLink/verify")
            .verifyRateLimit("verifyMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit
        }

        const { sessionToken } = await session.strategy.verifyMagicLink({ token, request })
        logger?.log("VERIFY_MAGIC_LINK_SUCCESS")

        const csrfToken = await createCSRF(ctx.jose.instance)
        const builder = new HeadersBuilder(headers)
            .setCookie(cookies.store.csrfToken.name, csrfToken, cookies.store.csrfToken.attributes)
            .setCookie(cookies.store.sessionToken.name, sessionToken, cookies.store.sessionToken.attributes)

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers: builder,
            fallbackRedirectTo,
        })
        return {
            success: true,
            redirect,
            redirectURL,
            headers: builder.toHeaders(),
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL,
                    },
                    { headers: builder.toHeaders(), status }
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
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers, status: statusCode }
                )
            },
        }
    }
}
