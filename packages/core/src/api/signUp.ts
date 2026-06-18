import { createCSRF } from "@/shared/crypto.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { verifyCSRFToken } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { createRedirectTo, getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, SignUpAPIOptions, SignUpAPIReturn } from "@/@types/api.ts"

export const signUp = async <Payload extends Record<string, unknown> = Record<string, unknown>>({
    ctx,
    payload,
    headers: headersInit,
    request: requestInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
}: FunctionAPIContext<SignUpAPIOptions<Payload>>): Promise<SignUpAPIReturn> => {
    const { signUp, cookies, sessionStrategy, logger } = ctx
    try {
        await verifyCSRFToken({
            headers: new Headers(headersInit),
            cookies,
            jose: ctx.jose,
            logger: logger,
            skipCSRFCheck,
        })

        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers: headersInit })
            const url = `${origin}${ctx.basePath}/signUp`
            request = new Request(url, { headers: headersInit })
        }
        await getOriginURL(request, ctx)
        const user = await signUp?.onCreateUser({
            payload,
        })
        if (!user) {
            throw new AuraAuthError({ code: "USER_CREATION_FAILED" })
        }
        const sessionToken = await sessionStrategy.createSession(user)
        const csrfToken = await createCSRF(ctx.jose)
        logger?.log("SIGN_UP_SUCCESS")

        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)

        let redirectURL: string | null = await createRedirectTo(request, redirectTo, ctx)
        redirectURL = redirectTo ? redirectURL : redirectURL === "/" ? null : redirectURL

        if (redirect && redirectURL) {
            headers.setHeader("Location", redirectURL)
        }

        const shouldRedirectServer = redirect && !!redirectURL
        const toHeaders = headers.toHeaders()
        return {
            success: true,
            redirect: shouldRedirectServer,
            redirectURL: redirect ? null : redirectURL,
            headers: toHeaders,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect: shouldRedirectServer,
                        redirectURL: shouldRedirectServer ? null : redirectURL,
                    },
                    { headers: toHeaders, status: shouldRedirectServer ? 302 : 200 }
                )
            },
        } as SignUpAPIReturn
    } catch (error) {
        let code = "SIGN_UP_ERROR"
        let message = "An error occurred during sign-up."
        let statusCode = 400
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
            statusCode = error.statusCode
        }
        console.error("Sign-up error: ", error)

        return {
            success: false,
            error: {
                code,
                message,
            },
            redirect: false,
            headers: new Headers(secureApiHeaders),
            redirectURL: null,
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
