import type { InternalStatefulContext, Session, User } from "@/@types/session.ts"
import type { DeepPartial } from "@/@types/utility.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getErrorName, verifyCSRFToken } from "@/shared/utils.ts"

export const __refreshSession = <DefaultUser extends User>({ ctx, cookieConfig }: InternalStatefulContext) => {
    const { logger, sessionConfig, jose, cookies } = ctx

    return async (
        headers: Headers,
        session: DeepPartial<Session<DefaultUser>>,
        skipCSRFCheck: boolean = false
    ): Promise<{
        session: Session<DefaultUser> | null
        headers: Headers
    }> => {
        logger?.log("STATEFUL_REFRESH_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "refreshSession",
                skip_csrf_check: skipCSRFCheck,
            },
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (!sessionToken) {
                logger?.log("STATEFUL_REFRESH_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            logger?.log("STATEFUL_CSRF_VERIFICATION_START", {
                structuredData: {
                    skip_csrf_check: skipCSRFCheck,
                },
            })

            const isValidToken = await verifyCSRFToken({
                headers,
                skipCSRFCheck,
                jose,
                cookies,
                logger,
            })

            logger?.log("STATEFUL_CSRF_VERIFICATION_RESULT", {
                structuredData: {
                    is_valid: isValidToken,
                },
            })

            if (!isValidToken) {
                logger?.log("STATEFUL_CSRF_VERIFICATION_FAILED", {
                    structuredData: {
                        reason: "csrf_token_invalid",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            const sessionByToken = await sessionConfig.adapter.getSessionByToken(sessionToken)
            logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                structuredData: {
                    session_found: Boolean(sessionByToken),
                    session_id: sessionByToken?.id || "",
                    user_id: sessionByToken?.userId || "",
                },
            })

            if (!sessionByToken || !sessionByToken.user) {
                logger?.log("STATEFUL_REFRESH_SESSION_NOT_FOUND", {
                    structuredData: {
                        reason: "session_not_found_or_no_user",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            if (sessionByToken.status !== "active") {
                return { session: null, headers: cookieConfig.clear() }
            }

            logger?.log("STATEFUL_SESSION_EXPIRATION_CHECK", {
                structuredData: {
                    session_id: sessionByToken.id,
                    expires_at: sessionByToken.expiresAt.toISOString(),
                    is_expired: new Date() > sessionByToken.expiresAt,
                },
            })

            if (new Date() > sessionByToken.expiresAt) {
                logger?.log("STATEFUL_SESSION_EXPIRED", {
                    structuredData: {
                        session_id: sessionByToken.id,
                        expires_at: sessionByToken.expiresAt.toISOString(),
                    },
                })
                await sessionConfig.adapter.revokeSession(sessionByToken.id, "user_logout")
                logger?.log("STATEFUL_EXPIRED_SESSION_REVOKED", {
                    structuredData: {
                        session_id: sessionByToken.id,
                        reason: "session_expired",
                    },
                })
                return { session: null, headers: cookieConfig.clear() }
            }

            const { attributes, ...spreadUser } = sessionByToken.user
            const currentUser = { ...spreadUser, ...attributes, sub: sessionByToken.user.id }
            logger?.log("STATEFUL_USER_DATA_MERGED", {
                structuredData: {
                    user_id: currentUser.id,
                    has_attributes: Boolean(attributes),
                },
            })

            const parsedCurrentUser = ctx.identity.skipValidation
                ? currentUser
                : await ctx.identity.schemaRegistry.parse(currentUser)
            logger?.log("STATEFUL_USER_VALIDATION", {
                structuredData: {
                    validation_skipped: ctx.identity.skipValidation || false,
                    user_id: currentUser.id,
                },
            })

            const sessionPayload = ctx.identity.skipValidation
                ? session.user
                : await ctx.identity.schemaRegistry.parseAsPartial(session.user)

            logger?.log("STATEFUL_SESSION_UPDATE_PAYLOAD", {
                structuredData: {
                    has_update_payload: Boolean(sessionPayload),
                    user_id: currentUser.id,
                },
            })

            const updatedUser = {
                ...parsedCurrentUser,
                ...sessionPayload,
                sub: parsedCurrentUser.sub,
            }

            logger?.log("STATEFUL_USER_FIELDS_MERGED", {
                structuredData: {
                    user_id: updatedUser.id,
                    fields_updated: Object.keys(sessionPayload || {}).join(","),
                },
            })

            const validatedUser = ctx.identity.skipValidation ? updatedUser : await ctx.identity.schemaRegistry.parse(updatedUser)
            logger?.log("STATEFUL_UPDATED_USER_VALIDATED", {
                structuredData: {
                    user_id: validatedUser.id,
                    validation_skipped: ctx.identity.skipValidation || false,
                },
            })

            if (sessionPayload && Object.keys(sessionPayload).length > 0) {
                const { sub: _sub, ...userUpdateFields } = validatedUser
                await sessionConfig.adapter.updateUser(sessionByToken.userId, userUpdateFields as any)
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

            await sessionConfig.adapter.updateSession(sessionByToken.id, {
                id: sessionByToken.id,
                userId: sessionByToken.userId,
                deviceId: sessionByToken.deviceId,
                authenticatedWith: sessionByToken.authenticatedWith,
                status: sessionByToken.status,
                mfaState: sessionByToken.mfaState,
                tokenHash: sessionByToken.tokenHash,
                expiresAt: newExpiresAt,
                metadata: sessionByToken.metadata,
            })

            logger?.log("STATEFUL_SESSION_UPDATED", {
                structuredData: {
                    session_id: sessionByToken.id,
                    new_expires_at: newExpiresAt.toISOString(),
                },
            })

            await sessionConfig.adapter.touchSession(sessionByToken.id, new Date())
            logger?.log("STATEFUL_SESSION_TOUCHED", {
                structuredData: {
                    session_id: sessionByToken.id,
                    last_activity: new Date().toISOString(),
                },
            })

            const updatedSession: Session<DefaultUser> = {
                user: validatedUser as DefaultUser,
                expires: newExpiresAt.toISOString(),
            }

            logger?.log("STATEFUL_REFRESH_SESSION_SUCCESS", {
                structuredData: {
                    session_id: sessionByToken.id,
                    user_id: sessionByToken.userId,
                    expires_at: newExpiresAt.toISOString(),
                },
            })

            return { session: updatedSession, headers: new Headers(secureApiHeaders) }
        } catch (error) {
            logger?.log("STATEFUL_REFRESH_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            return { session: null, headers: cookieConfig.clear() }
        }
    }
}
