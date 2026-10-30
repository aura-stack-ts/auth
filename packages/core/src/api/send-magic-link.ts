import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SendMagicLinkAPIOptions, SendMagicLinkAPIReturn } from "@/@types/api.ts"

export const sendMagicLink = async (
    email: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
    }: FunctionAPIContext<SendMagicLinkAPIOptions>
): Promise<SendMagicLinkAPIReturn> => {
    const { logger, sessionStrategy, magicLinks } = ctx
    try {
        logger?.log("SEND_MAGIC_LINK_INITIATED", {
            structuredData: {
                email,
                allowSignUp: magicLinks?.allowSignUp ?? false,
            },
        })
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/signIn/magicLink")
            .verifyRateLimit("sendMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit as SendMagicLinkAPIReturn
        }
        const { success, token, url } = await sessionStrategy.sendMagicLink({
            email,
            request,
            allowSignUp: magicLinks?.allowSignUp ?? false,
        })

        if (success) {
            await magicLinks?.sendMagicLinkEmail?.({ email, token, url })
        }

        const builder = new HeadersBuilder(secureApiHeaders)
        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, builder)
        return {
            success: true,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers: builder.toHeaders(),
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers: builder.toHeaders(), status: success ? (redirect ? 302 : 200) : 200 }
                )
            },
        } as SendMagicLinkAPIReturn
    } catch (error) {
        errorToLogMessage(error, "SEND_MAGIC_LINK_ERROR", logger)
        const { errors } = handleApiError(error, "SEND_MAGIC_LINK_ERROR", "An error occurred while sending the magic link.")

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
                    /**
                     * For security reasons, we always return a 200 status code to avoid leaking information
                     * about the existence of the email address or enumeration attacks.
                     */
                    { headers: secureApiHeaders, status: 200 }
                )
            },
        }
    }
}
