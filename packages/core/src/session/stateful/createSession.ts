import { AuraAuthError } from "@/shared/errors.ts"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import { createDevice as __createDevice } from "@/shared/utils/session-strategy.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { InternalStatefulContext, User } from "@/@types/index.ts"

export const __createSession = <DefaultUser extends User>({ ctx, cookies, cookieManager }: InternalStatefulContext) => {
    const { logger, sessionConfig } = ctx
    const createDevice = __createDevice({ ctx, cookies, cookieManager })

    return async (session: TypedJWTPayload<DefaultUser>, request: Request) => {
        logger?.log("STATEFUL_CREATE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "createSession",
                user_id: session.sub,
            },
        })

        if (ctx.identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }

        const payload = ctx.identity.skipValidation ? session : await ctx.identity.schemaRegistry.parse(session)
        logger?.log("STATEFUL_PAYLOAD_VALIDATION", {
            structuredData: {
                validation_skipped: ctx.identity.skipValidation || false,
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
        const { sub: userId, email, image, name, ...attributes } = payload

        let user = await sessionConfig.adapter.getUserById(userId as string)
        if (!user) {
            logger?.log("STATEFUL_USER_NOT_FOUND_CREATING", {
                structuredData: {
                    user_id: userId,
                    reason: "user_not_found_creating_new",
                },
            })
            user = await sessionConfig.adapter.createUser({
                id: userId as string,
                name,
                email,
                image,
                attributes,
            })
            logger?.log("STATEFUL_USER_CREATED", {
                structuredData: {
                    user_id: user.id,
                    has_email: Boolean(user.email),
                },
            })
        } else {
            logger?.log("STATEFUL_USER_FOUND_UPDATING", {
                structuredData: {
                    user_id: userId,
                    reason: "user_exists_updating",
                },
            })
            user = await sessionConfig.adapter.updateUser(userId as string, {
                name,
                email,
                image,
                attributes,
            })
            logger?.log("STATEFUL_USER_UPDATED", {
                structuredData: {
                    user_id: user.id,
                    has_email: Boolean(user.email),
                },
            })
        }

        const device = await createDevice(userId as string, request)

        const dbSession = await sessionConfig.adapter.createSession({
            id: cryptoId,
            userId: userId as string,
            deviceId: device.id,
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
}
