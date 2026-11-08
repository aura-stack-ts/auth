import { getErrorName } from "@/errors/aura-error.ts"
import { updateExpires } from "@/shared/utils/session-strategy.ts"
import type { Session, User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const refreshSession = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["refreshSession"] => {
    const { logger, jose, identity, session } = ctx

    const maxAge = session?.config?.maxAge ?? session?.config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = session?.config?.expirationStrategy ?? session?.config?.jwt?.expirationStrategy ?? "absolute"

    return async ({ session, headers }) => {
        try {
            const { sessionToken } = ctx.cookies.manager.getCookie(headers)
            if (!sessionToken) {
                return { session: null, headers: ctx.cookies.manager.clear() }
            }
            const claims = await jose.manager.verifyToken(sessionToken)
            const parsedClaims = identity.skipValidation ? claims : await identity.schemaRegistry.parseWithJWT(claims)

            const { exp, mexp, iat, ...claimsWithoutJWTFields } = parsedClaims
            const defaultPayload = identity.skipValidation
                ? claimsWithoutJWTFields
                : await identity.schemaRegistry.parse(claimsWithoutJWTFields)
            const { sub } = defaultPayload
            const sessionPayload = identity.skipValidation
                ? session.user
                : await identity.schemaRegistry.parseAsPartial(session.user)

            const expiresAt = session.expires
                ? new Date(Math.min(Date.now() + maxAge * 1000, new Date(session.expires).getTime()))
                : (updateExpires({ exp, maxAge, strategy }) ?? new Date(Date.now() + maxAge * 1000))
            const updatedSession: Session<DefaultUser> = {
                user: {
                    ...defaultPayload,
                    ...sessionPayload,
                    sub,
                } as DefaultUser,
                expires: expiresAt.toISOString(),
            }
            const verifiedPayload = await identity.schemaRegistry.parse(updatedSession.user)
            const issuedAt = strategy === "absolute" ? iat : Math.floor(Date.now() / 1000)
            const newToken = await jose.manager.createToken({
                ...verifiedPayload,
                exp: Math.floor(expiresAt.getTime() / 1000),
                iat: issuedAt,
                mexp,
            })
            updatedSession.expires = new Date(updatedSession.expires).toISOString()
            return { session: updatedSession, headers: ctx.cookies.manager.setCookie({ sessionToken: newToken }) }
        } catch (error) {
            logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
            return { session: null, headers: ctx.cookies.manager.clear() }
        }
    }
}
