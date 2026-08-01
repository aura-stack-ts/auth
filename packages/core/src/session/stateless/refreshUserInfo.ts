import { HeadersBuilder } from "@aura-stack/router"
import { __createSession } from "./createSession.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getStandardSession, toUnionHeaders } from "@/shared/utils.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { InternalStatelessContext, User } from "@/@types/session.ts"

export const __refreshUserInfo = <DefaultUser extends User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const { identity, jwtManager: jwt } = ctx
    const createSession = __createSession({ ctx, cookies, cookieManager })

    return async (userInfo: Partial<DefaultUser>, headers: Headers) => {
        const sessionToken = await createSession(userInfo as Partial<DefaultUser> as TypedJWTPayload<User>)

        const newHeaders = new HeadersBuilder(headers)
            .setCookie(cookies().sessionToken.name, sessionToken, cookies().sessionToken.attributes)
            .toHeaders()

        const session = await getStandardSession({
            jwt,
            identity,
            sessionToken,
        })
        const mergedHeaders = toUnionHeaders(newHeaders, secureApiHeaders)
        return { session, headers: mergedHeaders }
    }
}
