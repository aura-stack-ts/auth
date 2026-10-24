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
