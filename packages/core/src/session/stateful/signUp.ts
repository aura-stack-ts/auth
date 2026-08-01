import { AuraAuthError } from "@/shared/errors.ts"
import { createHash, createSecretValue, hashPassword } from "@/shared/crypto.ts"
import { createDevice as __createDevice } from "@/shared/utils/session-strategy.ts"
import type { InternalStatefulContext } from "@/@types/config.ts"

export const signUp = ({ ctx, cookies, cookieManager }: InternalStatefulContext) => {
    const { logger, sessionConfig } = ctx
    const createDevice = __createDevice({ ctx, cookies, cookieManager })

    return async (payload: Record<string, unknown>, request: Request): Promise<string> => {
        logger?.log("STATEFUL_CREATE_SESSION_START", {
            structuredData: {
                strategy: "stateful",
                operation: "signUp",
            },
        })

        if (ctx.identity.skipValidation) {
            logger?.log("IDENTITY_VALIDATION_DISABLED", {
                structuredData: {
                    identity_validation_disabled: true,
                },
            })
        }

        /**
         * @todo fix wrong logic from identity.schema (User schema) and signUp.schema (SignUpPayload schema)
         */
        console.log("payload: ", payload)
        const { password } = payload
        const validatedPayload = ctx.identity.skipValidation ? payload : await ctx.identity.schemaRegistry.parse(payload)
        logger?.log("STATEFUL_PAYLOAD_VALIDATION", {
            structuredData: {
                validation_skipped: ctx.identity.skipValidation || false,
                has_email: Boolean(validatedPayload.email) || false,
            },
        })

        const { sub: _sub, email, name, image, ...attributes } = validatedPayload

        if (email) {
            const getEmail = await sessionConfig.adapter.getUserByEmail(email)
            if (getEmail) {
                throw new AuraAuthError({ code: "EMAIL_ALREADY_REGISTERED" })
            }
        }

        const userId = createSecretValue(32)
        const user = await sessionConfig.adapter.createUser({
            id: userId,
            name,
            email,
            image,
            attributes,
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        logger?.log("STATEFUL_USER_CREATED", {
            structuredData: {
                user_id: user.id,
                has_email: Boolean(user.email),
            },
        })

        const account = await sessionConfig.adapter.createAccount({
            id: createSecretValue(32),
            userId: user.id,
            provider: "credentials",
            providerUserId: user.id,
            type: "credentials",
            status: "active",
        })

        console.log("password: ", password)
        if (password) {
            const passwordHash = await hashPassword(password as string)
            await sessionConfig.adapter.createCredentialAccount({
                accountId: account.id,
                passwordHash,
            })
        }

        const device = await createDevice(user.id, request)
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

        const dbSession = await sessionConfig.adapter.createSession({
            id: createSecretValue(32),
            userId: user.id,
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
