import { timingSafeEqual } from "@/exports/crypto.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors/aura-error.ts"
import { isJWTExpired, isJWTPayloadWithToken, isValidJWS } from "@/shared/assert.ts"
import { getOptionalCookie } from "@/shared/http/cookie.ts"
import type { JoseInstance, User } from "@/@types/index.ts"
import type { InternalCookieStoreConfig, RouterGlobalContext } from "@/@types/internal.ts"

export const verifyCSRFToken = async <DefaultUser extends User = User>(jose: JoseInstance<DefaultUser>, token: string) => {
    try {
        if (!isValidJWS(token)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_INVALID" })
        }
        const payload = await jose.verifyJWS(token)
        if (!isJWTPayloadWithToken(payload)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_INVALID_VALUE" })
        }
        return payload
    } catch (cause) {
        if (isAuraAuthError(cause)) throw cause
        if (isJWTExpired(cause)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_EXPIRED", cause })
        }
        throw new AuraAuthError({ code: "CSRF_TOKEN_INVALID", cause })
    }
}

export const assertCSRFToken = async <DefaultUser extends User = User>(jose: JoseInstance<DefaultUser>, token: string) => {
    return Boolean(await verifyCSRFToken(jose, token))
}

export const verifyDoubleSubmitCSRFToken = async <DefaultUser extends User = User>(
    jose: JoseInstance<DefaultUser>,
    cookie: string,
    header: string
): Promise<boolean> => {
    const cookiePayload = await verifyCSRFToken(jose, cookie)
    const headerPayload = await verifyCSRFToken(jose, header)

    if (!timingSafeEqual(cookiePayload.token, headerPayload.token)) {
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISMATCH" })
    }
    return true
}

export const verifyDoubleSubmitCSRFTokenFromRequest = async ({
    headers,
    skipCSRFCheck,
    doubleSubmitToken,
    ctx,
    csrfTokenValue,
    cookieStore,
}: {
    headers: Headers
    skipCSRFCheck: boolean
    doubleSubmitToken?: string
    csrfTokenValue?: string
    ctx: RouterGlobalContext<any, any>
    cookieStore: InternalCookieStoreConfig
}): Promise<boolean> => {
    const csrfToken = csrfTokenValue || getOptionalCookie(headers, cookieStore.csrfToken.name)
    if (!csrfToken) {
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
    }

    await verifyCSRFToken(ctx.jose.instance, csrfToken)
    if (skipCSRFCheck && !doubleSubmitToken) {
        return true
    }

    const requestToken = doubleSubmitToken ?? headers.get("X-CSRF-Token")
    if (!requestToken) {
        throw new AuraAuthError({ code: "CSRF_DOUBLE_SUBMIT_FAILED" })
    }

    await verifyDoubleSubmitCSRFToken(ctx.jose.instance, csrfToken, requestToken)
    ctx.logger?.log("CSRF_TOKEN_VERIFIED")
    return true
}
