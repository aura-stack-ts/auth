import { getExpiresAt } from "@/shared/utils/session-strategy.ts"
import type { Session, User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const updateSession = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["updateSession"] => {
    const { jose, identity, session } = ctx

    const maxAge = session?.config?.maxAge ?? session?.config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = session?.config?.expirationStrategy ?? session?.config?.jwt?.expirationStrategy ?? "absolute"

    return async ({ session, rawSession, cookieStore }) => {
        const now = Date.now()

        const { exp, mexp, iat } = await identity.schemaRegistry.parseWithJWT(rawSession)
        const defaultPayload = identity.skipValidation ? rawSession : await identity.schemaRegistry.parse(rawSession)

        const { sub } = defaultPayload
        /**
         * Removes `skipValidation` support in the next major version.
         * It introduces privilege escalation attacks
         */
        const sessionPayload = identity.skipValidation ? session.user : await identity.schemaRegistry.parseAsPartial(session.user)

        const expiresAt = await getExpiresAt({
            ctx,
            exp,
            maxAge,
            strategy,
            expires: session.expires,
        })

        const updatedSession: Session<DefaultUser> = {
            user: {
                ...defaultPayload,
                ...sessionPayload,
                sub,
            },
            expires: expiresAt.toISOString(),
        }
        const verifiedPayload = await identity.schemaRegistry.parse(updatedSession.user)
        const issuedAt = strategy === "absolute" ? iat : Math.floor(now / 1000)
        const sessionToken = await jose.manager.createToken({
            ...verifiedPayload,
            exp: Math.floor(expiresAt.getTime() / 1000),
            iat: issuedAt,
            mexp,
        })
        return {
            session: { expires: updatedSession.expires, user: verifiedPayload },
            headers: ctx.cookies.manager.setCookie({ sessionToken, store: cookieStore }),
        }
    }
}
