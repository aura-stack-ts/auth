import { toUnionHeaders } from "@/shared/http/headers.ts"
import type { Session, SessionWithUserEntity, User } from "@/@types/index.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const updateSession = <DefaultUser extends User>(
    ctx: InternalContextForStateful
): SessionStrategy<DefaultUser>["updateSession"] => {
    const { logger, session: sessionConfig } = ctx

    const maxAge = sessionConfig?.config?.maxAge ?? 60 * 60 * 24 * 15

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
            const userUpdateFields = Object.fromEntries(
                Object.entries(verifiedPayload).filter(([field]) => field !== "sub" && Object.hasOwn(sessionPayload, field))
            )
            await sessionConfig.config.adapter.updateUser(sessionByToken.userId, userUpdateFields as any)
            logger?.log("STATEFUL_USER_UPDATED_IN_DB", {
                structuredData: {
                    user_id: sessionByToken.userId,
                    fields_updated: Object.keys(userUpdateFields).join(","),
                },
            })
        }

        const now = Date.now()
        const expiresAt = session.expires
            ? new Date(Math.min(now + maxAge * 1000, new Date(session.expires).getTime()))
            : new Date(now + maxAge * 1000)
        logger?.log("STATEFUL_SESSION_EXPIRATION_UPDATE", {
            structuredData: {
                session_id: sessionByToken.id,
                old_expires_at: sessionByToken.expiresAt.toISOString(),
                new_expires_at: expiresAt.toISOString(),
            },
        })

        await sessionConfig.config.adapter.updateSession(sessionByToken.id, {
            expiresAt,
        })

        logger?.log("STATEFUL_SESSION_UPDATED", {
            structuredData: {
                session_id: sessionByToken.id,
                new_expires_at: expiresAt.toISOString(),
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
            expires: expiresAt.toISOString(),
        }

        logger?.log("STATEFUL_REFRESH_SESSION_SUCCESS", {
            structuredData: {
                session_id: sessionByToken.id,
                user_id: sessionByToken.userId,
                expires_at: expiresAt.toISOString(),
            },
        })

        return { session: updatedSession, headers: refreshHeaders(ctx.cookies.manager.setCookie({ sessionToken })) }
    }
}
