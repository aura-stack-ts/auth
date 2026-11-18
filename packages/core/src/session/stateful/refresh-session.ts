import { toUnionHeaders } from "@/shared/http/headers.ts"
import type { Session, SessionWithUserEntity, User } from "@/@types/index.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const refreshSession = <DefaultUser extends User>(
    ctx: InternalContextForStateful
): SessionStrategy<DefaultUser>["refreshSession"] => {
    const { logger, session: sessionConfig } = ctx

    return async ({ headers, session, sessionToken, rawSession }) => {
        const refreshHeaders = (newHeaders: Headers) => {
            return toUnionHeaders(headers, newHeaders)
        }

        logger?.log("STATEFUL_REFRESH_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "refreshSession",
            },
        })

        const sessionByToken = rawSession as SessionWithUserEntity
        const { attributes, ...spreadUser } = sessionByToken.user
        const currentUser = { ...spreadUser, ...attributes, sub: sessionByToken.user.id }

        const verifiedUser = ctx.identity.skipValidation ? currentUser : await ctx.identity.schemaRegistry.parse(currentUser)
        const sessionPayload = ctx.identity.skipValidation
            ? session.user
            : await ctx.identity.schemaRegistry.parseAsPartial(session.user)

        const updatedUser = {
            ...verifiedUser,
            ...sessionPayload,
            sub: verifiedUser.sub,
        }

        const verifiedPayload = await ctx.identity.schemaRegistry.parse(updatedUser)

        if (sessionPayload && Object.keys(sessionPayload).length > 0) {
            const { sub: _sub, ...userUpdateFields } = verifiedPayload
            await sessionConfig.config.adapter.updateUser(sessionByToken.userId, userUpdateFields as any)
            logger?.log("STATEFUL_USER_UPDATED_IN_DB", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    fields_updated: Object.keys(userUpdateFields).join(","),
                },
            })
        }

        const newExpiresAt = new Date(Date.now() + 60 * 60 * 24 * 15 * 1000)
        logger?.log("STATEFUL_SESSION_EXPIRATION_UPDATE", {
            structuredData: {
                session_id: sessionByToken.id,
                old_expires_at: sessionByToken.expiresAt.toISOString(),
                new_expires_at: newExpiresAt.toISOString(),
            },
        })

        await sessionConfig.config.adapter.updateSession(sessionByToken.id, {
            expiresAt: newExpiresAt,
        })

        logger?.log("STATEFUL_SESSION_UPDATED", {
            structuredData: {
                session_id: sessionByToken.id,
                new_expires_at: newExpiresAt.toISOString(),
            },
        })

        await sessionConfig.config.adapter.touchSession(sessionByToken.id, new Date())
        logger?.log("STATEFUL_SESSION_TOUCHED", {
            structuredData: {
                session_id: sessionByToken.id,
                last_activity: new Date().toISOString(),
            },
        })

        const updatedSession: Session<DefaultUser> = {
            user: verifiedPayload,
            expires: newExpiresAt.toISOString(),
        }

        logger?.log("STATEFUL_REFRESH_SESSION_SUCCESS", {
            structuredData: {
                session_id: sessionByToken.id,
                user_id: sessionByToken.userId,
                expires_at: newExpiresAt.toISOString(),
            },
        })

        return { session: updatedSession, headers: refreshHeaders(ctx.cookies.manager.setCookie({ sessionToken })) }
    }
}
