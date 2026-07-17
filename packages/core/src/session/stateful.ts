import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { verifyCSRFToken, getErrorName } from "@/shared/utils.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import type { JoseInstance } from "@/@types/index.ts"
import type { DeepPartial } from "@/@types/utility.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { DatabaseStrategyOptions, GetStatefulSessionReturn, Session, SessionStrategy, User } from "@/@types/session.ts"

export const createStatefulStrategy = <DefaultUser extends User = User>({
    config,
    cookies,
    identity,
    logger,
    jose,
}: DatabaseStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const cookieConfig = createCookieManager(cookies)

    const getSession = async (headers: Headers): Promise<GetStatefulSessionReturn<DefaultUser>> => {
        logger?.log("STATEFUL_GET_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "getSession",
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
                logger?.log("STATEFUL_SESSION_TOKEN_MISSING", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
                return {
                    session: null,
                    headers: new Headers(secureApiHeaders),
                }
            }

            const session = await config.adapter.getSessionByToken(sessionToken)
            logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                structuredData: {
                    session_found: Boolean(session),
                    session_id: session?.id || "",
                    user_id: session?.userId || "",
                },
            })

            if (!session) {
                logger?.log("STATEFUL_SESSION_NOT_FOUND", {
                    structuredData: {
                        reason: "session_not_found_in_database",
                    },
                })
                throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" })
            }

            if (!session.user) {
                logger?.log("STATEFUL_SESSION_NO_USER", {
                    structuredData: {
                        reason: "session_has_no_associated_user",
                        session_id: session.id,
                    },
                })
                throw new AuraAuthError({ code: "DATABASE_TOKEN_HASH_NOT_FOUND" })
            }

            logger?.log("STATEFUL_SESSION_STATUS_CHECK", {
                structuredData: {
                    session_id: session.id,
                    status: session.status,
                    expires_at: session.expiresAt.toISOString(),
                    is_expired: new Date() > session.expiresAt,
                },
            })

            if (session.status !== "active") {
                logger?.log("STATEFUL_SESSION_INACTIVE", {
                    structuredData: {
                        session_id: session.id,
                        status: session.status,
                    },
                })
                return {
                    session: null,
                    headers: new Headers(secureApiHeaders),
                }
            }

            if (new Date() > session.expiresAt) {
                logger?.log("STATEFUL_SESSION_EXPIRED", {
                    structuredData: {
                        session_id: session.id,
                        expires_at: session.expiresAt.toISOString(),
                    },
                })
                await config.adapter.revokeSession(session.id, "user_logout")

                return {
                    session: null,
                    headers: cookieConfig.clear(),
                }
            }

            const { attributes, ...userPayload } = session.user
            const user = { ...userPayload, ...attributes, sub: session.user.id }
            logger?.log("STATEFUL_USER_DATA_MERGED", {
                structuredData: {
                    user_id: user.id,
                    has_attributes: Boolean(session.user.attributes) || false,
                },
            })

            const parsedUser = identity.skipValidation ? user : await identity.schemaRegistry.parse(user)
            logger?.log("STATEFUL_USER_VALIDATION", {
                structuredData: {
                    validation_skipped: identity.skipValidation || false,
                    user_id: user.id,
                },
            })

            logger?.log("STATEFUL_GET_SESSION_SUCCESS", {
                structuredData: {
                    session_id: session.id,
                    user_id: user.id,
                    expires_at: session.expiresAt.toISOString(),
                },
            })

            return {
                session: {
                    user: parsedUser as DefaultUser,
                    expires: session.expiresAt.toISOString(),
                },
                headers: cookieConfig.setCookie({ sessionToken }),
            }
        } catch (error) {
            logger?.log("STATEFUL_GET_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            return {
                session: null,
                headers: cookieConfig.clear(),
            }
        }
    }

    const createSession = async (session: TypedJWTPayload<DefaultUser>) => {
        logger?.log("STATEFUL_CREATE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "createSession",
                user_id: session.sub,
            },
        })

        if (identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }

        const payload = identity.skipValidation ? session : await identity.schemaRegistry.parse(session)
        logger?.log("STATEFUL_PAYLOAD_VALIDATION", {
            structuredData: {
                validation_skipped: identity.skipValidation || false,
                user_id: payload.sub || "",
                has_email: Boolean(payload.email) || false,
            },
        })

        if (!payload.sub) {
            logger?.log("STATEFUL_CREATE_SESSION_ERROR", {
                structuredData: {
                    error: "missing_user_id",
                    reason: "payload.sub is required",
                },
            })
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        const secretValue = createSecretValue(64)
        logger?.log("STATEFUL_TOKEN_GENERATED", {
            structuredData: {
                token_length: secretValue.length,
            },
        })

        const tokenHash = await createHash(secretValue)
        logger?.log("STATEFUL_TOKEN_HASHED", {
            structuredData: {
                hash_length: tokenHash.length,
            },
        })

        const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 15 * 1000)
        logger?.log("STATEFUL_SESSION_EXPIRATION_SET", {
            structuredData: {
                expires_at: expiresAt?.toISOString(),
                max_age_days: 15,
            },
        })

        const cryptoId = createSecretValue(32)
        const dbSession = await config.adapter.createSession({
            id: cryptoId,
            userId: payload.sub as string,
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash,
            expiresAt,
            metadata: null,
        })

        logger?.log("STATEFUL_SESSION_CREATED", {
            structuredData: {
                session_id: dbSession.id,
                user_id: dbSession.userId,
                status: dbSession.status,
                expires_at: dbSession?.expiresAt?.toISOString(),
            },
        })

        logger?.log("STATEFUL_CREATE_SESSION_SUCCESS", {
            structuredData: {
                session_id: dbSession.id,
                user_id: dbSession.userId,
                token_returned: true,
            },
        })

        return secretValue
    }

    const refreshSession = async (
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
                cookies: cookies(),
                logger,
                jose: jose as JoseInstance,
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

            const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
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
                await config.adapter.revokeSession(sessionByToken.id, "user_logout")
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

            const parsedCurrentUser = identity.skipValidation ? currentUser : await identity.schemaRegistry.parse(currentUser)
            logger?.log("STATEFUL_USER_VALIDATION", {
                structuredData: {
                    validation_skipped: identity.skipValidation || false,
                    user_id: currentUser.id,
                },
            })

            const sessionPayload = identity.skipValidation
                ? session.user
                : await identity.schemaRegistry.parseAsPartial(session.user)

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

            const validatedUser = identity.skipValidation ? updatedUser : await identity.schemaRegistry.parse(updatedUser)
            logger?.log("STATEFUL_UPDATED_USER_VALIDATED", {
                structuredData: {
                    user_id: validatedUser.id,
                    validation_skipped: identity.skipValidation || false,
                },
            })

            if (sessionPayload && Object.keys(sessionPayload).length > 0) {
                const { sub: _sub, ...userUpdateFields } = validatedUser
                await config.adapter.updateUser(sessionByToken.userId, userUpdateFields as any)
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

            await config.adapter.updateSession(sessionByToken.id, {
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

            await config.adapter.touchSession(sessionByToken.id, new Date())
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

    const revokeSession = async (sessionId: string): Promise<void> => {
        logger?.log("STATEFUL_REVOKE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "revokeSession",
                session_id: sessionId,
            },
        })

        if (!sessionId) {
            logger?.log("STATEFUL_REVOKE_SESSION_ERROR", {
                structuredData: {
                    error: "missing_session_id",
                    reason: "session_id is required",
                },
            })
            throw new AuraAuthError({ code: "INVALID_USER_INFO" })
        }

        await config.adapter.revokeSession(sessionId, "user_logout")

        logger?.log("STATEFUL_REVOKE_SESSION_SUCCESS", {
            structuredData: {
                session_id: sessionId,
                reason: "user_logout",
            },
        })
    }

    const destroySession = async (headers: Headers, skipCSRFCheck: boolean = false) => {
        logger?.log("STATEFUL_DESTROY_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "destroySession",
            },
        })

        await verifyCSRFToken({
            headers,
            cookies: cookies(),
            logger,
            jose: jose as JoseInstance,
            skipCSRFCheck,
        })

        try {
            const { sessionToken } = cookieConfig.getCookie(headers)
            logger?.log("STATEFUL_SESSION_TOKEN_EXTRACTED", {
                structuredData: {
                    has_token: Boolean(sessionToken),
                    token_length: sessionToken?.length || 0,
                },
            })

            if (sessionToken) {
                const sessionByToken = await config.adapter.getSessionByToken(sessionToken)
                logger?.log("STATEFUL_SESSION_DB_LOOKUP", {
                    structuredData: {
                        session_found: Boolean(sessionByToken),
                        session_id: sessionByToken?.id || "",
                    },
                })

                if (sessionByToken) {
                    await config.adapter.revokeSession(sessionByToken.id, "user_logout")
                    logger?.log("STATEFUL_SESSION_REVOKED", {
                        structuredData: {
                            session_id: sessionByToken.id,
                            reason: "user_logout",
                        },
                    })
                } else {
                    logger?.log("STATEFUL_SESSION_NOT_FOUND_FOR_DESTRUCTION", {
                        structuredData: {
                            reason: "session_not_found_in_database",
                        },
                    })
                }
            } else {
                logger?.log("STATEFUL_NO_TOKEN_FOR_DESTRUCTION", {
                    structuredData: {
                        reason: "no_session_token_in_cookie",
                    },
                })
            }
        } catch (error) {
            logger?.log("STATEFUL_DESTROY_SESSION_ERROR", {
                structuredData: {
                    error_type: getErrorName(error),
                    error_message: error instanceof Error ? error.message : String(error),
                },
            })
            throw error
        }

        const clearedHeaders = cookieConfig.clear()
        logger?.log("STATEFUL_DESTROY_SESSION_SUCCESS", {
            structuredData: {
                cookies_cleared: true,
            },
        })

        return clearedHeaders
    }

    return {
        getSession,
        createSession,
        refreshSession,
        revokeSession,
        destroySession,
    }
}
