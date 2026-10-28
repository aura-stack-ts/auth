import { signIn } from "@/session/stateless/sign-in.ts"
import { signUp } from "@/session/stateless/sign-up.ts"
import { getSession } from "@/session/stateless/get-session.ts"
import { revokeToken } from "@/session/stateless/revoke-token.ts"
import { oauthCallback } from "@/session/stateless/oauth-callback.ts"
import { createSession } from "@/session/stateless/create-session.ts"
import { destroySession } from "@/session/stateless/destroy-session.ts"
import { refreshSession } from "@/session/stateless/refresh-session.ts"
import { refreshUserInfo } from "@/session/stateless/refresh-userInfo.ts"
import { signInCredentials } from "@/session/stateless/sign-in-credentials.ts"
import { getProviderTokens } from "@/session/stateless/get-provider-tokens.ts"
import { isProviderConnected } from "@/session/stateless/is-provider-connected.ts"
import {
    sendVerificationEmail,
    revokeSession,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    changeEmail,
    verifyEmailChange,
} from "@/session/stateless/unsupported.ts"
import type { SessionStrategy, User } from "@/@types/index.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>(
    ctx: InternalStatelessContext
): SessionStrategy<DefaultUser> => {
    return {
        revokeSession: revokeSession(ctx),
        signIn: signIn(ctx),
        signUp: signUp(ctx),
        getSession: getSession(ctx),
        verifyEmail: verifyEmail(ctx),
        revokeToken: revokeToken(ctx),
        changeEmail: changeEmail(ctx),
        createSession: createSession(ctx),
        resetPassword: resetPassword(ctx),
        oauthCallback: oauthCallback(ctx),
        changePassword: changePassword(ctx),
        forgotPassword: forgotPassword(ctx),
        refreshSession: refreshSession(ctx),
        destroySession: destroySession(ctx),
        refreshUserInfo: refreshUserInfo(ctx),
        verifyEmailChange: verifyEmailChange(ctx),
        getProviderTokens: getProviderTokens(ctx),
        signInCredentials: signInCredentials(ctx),
        isProviderConnected: isProviderConnected(ctx),
        sendVerificationEmail: sendVerificationEmail(ctx),
    }
}
