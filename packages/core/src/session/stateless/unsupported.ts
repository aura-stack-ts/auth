import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy, User } from "@/@types/session.ts"
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
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "changeEmail is not supported in stateless mode",
        })
    }
}

export const verifyEmailChange = (_: InternalStatelessContext): SessionStrategy["verifyEmailChange"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyEmailChange is not supported in stateless mode",
        })
    }
}

export const cancelEmailChange = (_: InternalStatelessContext) => {
    return async (_options: {}): Promise<void> => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "cancelEmailChange is not supported in stateless mode",
        })
    }
}

export const sendMagicLink = <DefaultUser extends User>(_: InternalStatelessContext) => {
    return async (_options: {}): ReturnType<SessionStrategy<DefaultUser>["sendMagicLink"]> => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "sendMagicLink is not supported in stateless mode.",
        })
    }
}

export const verifyMagicLink = <DefaultUser extends User>(_: InternalStatelessContext) => {
    return async (_options: {}): ReturnType<SessionStrategy<DefaultUser>["verifyMagicLink"]> => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyMagicLink is not supported in stateless mode.",
        })
    }
}
