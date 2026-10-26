import type { SessionStrategy } from "@/@types/session.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const revokeSession = (_: InternalStatelessContext) => {
    return async (_sessionId: string): Promise<void> => {
        throw new Error("revokeSession is not supported in stateless mode.")
    }
}

export const sendVerificationEmail = (_: InternalStatelessContext): SessionStrategy["sendVerificationEmail"] => {
    return async () => {
        throw new Error("sendVerificationEmail is not supported in stateless mode.")
    }
}

export const verifyEmail = (_: InternalStatelessContext): SessionStrategy["verifyEmail"] => {
    return async () => {
        throw new Error("verifyEmail is not supported in stateless mode.")
    }
}

export const forgotPassword = (_: InternalStatelessContext): SessionStrategy["forgotPassword"] => {
    return async () => {
        throw new Error("forgotPassword is not supported in stateless mode.")
    }
}

export const resetPassword = (_: InternalStatelessContext): SessionStrategy["resetPassword"] => {
    return async () => {
        throw new Error("resetPassword is not supported in stateless mode.")
    }
}

export const changePassword = (_: InternalStatelessContext) => {
    return async (_userId: string, _currentPassword: string, _newPassword: string): Promise<void> => {
        throw new Error("changePassword is not supported in stateless mode.")
    }
}
