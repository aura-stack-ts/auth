import type { SessionStrategy, User } from "@/@types/session.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const revokeSession = (_: InternalStatelessContext) => {
    return async (_sessionId: string): Promise<void> => {
        throw new Error("revokeSession is not supported in stateless mode.")
    }
}

export const sendVerificationEmail = (_: InternalStatelessContext) => {
    return async (_email: string, _request: Request): Promise<{ token: string; url: string }> => {
        throw new Error("sendVerificationEmail is not supported in stateless mode.")
    }
}

export const verifyEmail = (_: InternalStatelessContext) => {
    return async (_token: string) => {
        throw new Error("verifyEmail is not supported in stateless mode.")
    }
}

export const forgotPassword = (_: InternalStatelessContext) => {
    return async (_email: string, _request: Request): Promise<{ token: string; url: string }> => {
        throw new Error("forgotPassword is not supported in stateless mode.")
    }
}

export const resetPassword = (_: InternalStatelessContext) => {
    return async (_token: string, _newPassword: string): Promise<void> => {
        throw new Error("resetPassword is not supported in stateless mode.")
    }
}

export const changePassword = (_: InternalStatelessContext) => {
    return async (_userId: string, _currentPassword: string, _newPassword: string): Promise<void> => {
        throw new Error("changePassword is not supported in stateless mode.")
    }
}

export const changeEmail = (_: InternalStatelessContext) => {
    return async (
        _userId: string,
        _currentPassword: string,
        _newEmail: string
    ): Promise<{ email: string; confirmToken: string; confirmURL: string; cancelToken: string; cancelURL: string }> => {
        throw new Error("changeEmail is not supported in stateless mode.")
    }
}

export const verifyEmailChange = (_: InternalStatelessContext) => {
    return async (_token: string): Promise<{ success: boolean }> => {
        throw new Error("verifyEmailChange is not supported in stateless mode.")
    }
}

export const cancelEmailChange = (_: InternalStatelessContext) => {
    return async (_options: {}): Promise<void> => {
        throw new Error("cancelEmailChange is not supported in stateless mode.")
    }
}

export const sendMagicLink = <DefaultUser extends User>(_: InternalStatelessContext) => {
    return async (_options: {}): ReturnType<SessionStrategy<DefaultUser>["sendMagicLink"]> => {
        throw new Error("sendMagicLink is not supported in stateless mode.")
    }
}

export const verifyMagicLink = <DefaultUser extends User>(_: InternalStatelessContext) => {
    return async (_options: {}): ReturnType<SessionStrategy<DefaultUser>["verifyMagicLink"]> => {
        throw new Error("verifyMagicLink is not supported in stateless mode.")
    }
}
