import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy, InternalStatelessContext } from "@/@types/internal.ts"

export const revokeSession = (_: InternalStatelessContext): SessionStrategy["revokeSession"] => {
    return async () => {
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

export const cancelEmailChange = (_: InternalStatelessContext): SessionStrategy["cancelEmailChange"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "cancelEmailChange is not supported in stateless mode",
        })
    }
}

export const sendMagicLink = (_: InternalStatelessContext): SessionStrategy["sendMagicLink"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "sendMagicLink is not supported in stateless mode.",
        })
    }
}

export const verifyMagicLink = (_: InternalStatelessContext): SessionStrategy["verifyMagicLink"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyMagicLink is not supported in stateless mode.",
        })
    }
}
