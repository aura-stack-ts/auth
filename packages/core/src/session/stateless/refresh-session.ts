import { toUnionHeaders } from "@/shared/http/headers.ts"
import { updateExpires } from "@/shared/utils/session-strategy.ts"
import type { Session, User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const refreshSession = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["refreshSession"] => {
    const { jose, identity, session } = ctx

    const maxAge = session?.config?.maxAge ?? session?.config?.jwt?.maxAge ?? 60 * 60 * 24 * 15
    const strategy = session?.config?.expirationStrategy ?? session?.config?.jwt?.expirationStrategy ?? "absolute"

    return async ({ session, headers, rawSession }) => {
        const refreshHeaders = (newHeaders: Headers) => {
            return toUnionHeaders(headers, newHeaders)
        }
        const now = Date.now()

        const { exp, mexp, iat } = await identity.schemaRegistry.parseWithJWT(rawSession)
        const defaultPayload = identity.skipValidation ? rawSession : await identity.schemaRegistry.parse(rawSession)

        const { sub } = defaultPayload
        const sessionPayload = identity.skipValidation ? session.user : await identity.schemaRegistry.parseAsPartial(session.user)

        const expiresAt = session.expires
            ? new Date(Math.min(now + maxAge * 1000, new Date(session.expires).getTime()))
            : (updateExpires({ exp, maxAge, strategy }) ?? new Date(now + maxAge * 1000))

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
        return { session: updatedSession, headers: refreshHeaders(ctx.cookies.manager.setCookie({ sessionToken })) }
    }
}
