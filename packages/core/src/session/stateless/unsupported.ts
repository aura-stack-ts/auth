import { AuraAuthError } from "@/errors/aura-error.ts"
import type { SessionStrategy, InternalContextForStateless } from "@/@types/internal.ts"

export const revokeSession = (_: InternalContextForStateless): SessionStrategy["revokeSession"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "revokeSession is not supported in stateless mode.",
        })
    }
}

export const sendVerificationEmail = (_: InternalContextForStateless): SessionStrategy["sendVerificationEmail"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "sendVerificationEmail is not supported in stateless mode",
        })
    }
}

export const verifyEmail = (_: InternalContextForStateless): SessionStrategy["verifyEmail"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyEmail is not supported in stateless mode",
        })
    }
}

export const forgotPassword = (_: InternalContextForStateless): SessionStrategy["forgotPassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "forgotPassword is not supported in stateless mode",
        })
    }
}

export const resetPassword = (_: InternalContextForStateless): SessionStrategy["resetPassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "resetPassword is not supported in stateless mode",
        })
    }
}

export const changePassword = (_: InternalContextForStateless): SessionStrategy["changePassword"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "changePassword is not supported in stateless mode",
        })
    }
}

export const changeEmail = (_: InternalContextForStateless): SessionStrategy["changeEmail"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "changeEmail is not supported in stateless mode",
        })
    }
}

export const verifyEmailChange = (_: InternalContextForStateless): SessionStrategy["verifyEmailChange"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyEmailChange is not supported in stateless mode",
        })
    }
}

export const cancelEmailChange = (_: InternalContextForStateless): SessionStrategy["cancelEmailChange"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "cancelEmailChange is not supported in stateless mode",
        })
    }
}

export const sendMagicLink = (_: InternalContextForStateless): SessionStrategy["sendMagicLink"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "sendMagicLink is not supported in stateless mode.",
        })
    }
}

export const verifyMagicLink = (_: InternalContextForStateless): SessionStrategy["verifyMagicLink"] => {
    return async () => {
        throw new AuraAuthError({
            code: "UNSUPPORTED_FUNCTION_IN_STATELESS_MODE",
            cause: "verifyMagicLink is not supported in stateless mode.",
        })
    }
}
