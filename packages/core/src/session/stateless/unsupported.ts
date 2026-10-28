import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy } from "@/@types/session.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const revokeSession = (_: InternalStatelessContext) => {
    return async (_sessionId: string): Promise<void> => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "revokeSession is not supported in stateless mode.",
        })
    }
}

export const sendVerificationEmail = (_: InternalStatelessContext): SessionStrategy["sendVerificationEmail"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "sendVerificationEmail is not supported in stateless mode",
        })
    }
}

export const verifyEmail = (_: InternalStatelessContext): SessionStrategy["verifyEmail"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyEmail is not supported in stateless mode",
        })
    }
}

export const forgotPassword = (_: InternalStatelessContext): SessionStrategy["forgotPassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "forgotPassword is not supported in stateless mode",
        })
    }
}

export const resetPassword = (_: InternalStatelessContext): SessionStrategy["resetPassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "resetPassword is not supported in stateless mode",
        })
    }
}

export const changePassword = (_: InternalStatelessContext): SessionStrategy["changePassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "changePassword is not supported in stateless mode",
        })
    }
}

export const changeEmail = (_: InternalStatelessContext): SessionStrategy["changeEmail"] => {
    return async () => {
        throw new Error("changeEmail is not supported in stateless mode.")
    }
}

export const verifyEmailChange = (_: InternalStatelessContext): SessionStrategy["verifyEmailChange"] => {
    return async () => {
        throw new Error("verifyEmailChange is not supported in stateless mode.")
    }
}

export const cancelEmailChange = (_: InternalStatelessContext) => {
    return async (_options: {}): Promise<void> => {
        throw new Error("cancelEmailChange is not supported in stateless mode.")
    }
}
