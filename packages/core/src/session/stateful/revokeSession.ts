import { AuraAuthError } from "@/shared/errors.ts"
import type { InternalStatefulContext } from "@/@types/session.ts"

export const __revokeSession = ({ ctx }: InternalStatefulContext) => {
    const { logger, sessionConfig } = ctx

    return async (sessionId: string): Promise<void> => {
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

        await sessionConfig.adapter.revokeSession(sessionId, "user_logout")

        logger?.log("STATEFUL_REVOKE_SESSION_SUCCESS", {
            structuredData: {
                session_id: sessionId,
                reason: "user_logout",
            },
        })
    }
}
