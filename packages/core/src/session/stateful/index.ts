import { signIn } from "@/session/stateful/sign-in.ts"
import { signUp } from "@/session/stateful/sign-up.ts"
import { getSession } from "@/session/stateful/get-session.ts"
import { revokeToken } from "@/session/stateful/revoke-token.ts"
import { createSession } from "@/session/stateful/create-session.ts"
import { oauthCallback } from "@/session/stateful/oauth-callback.ts"
import { revokeSession } from "@/session/stateful/revoke-session.ts"
import { destroySession } from "@/session/stateful/destroy-session.ts"
import { refreshSession } from "@/session/stateful/refresh-session.ts"
import { refreshUserInfo } from "@/session/stateful/refresh-userInfo.ts"
import { signInCredentials } from "@/session/stateful/sign-in-credentials.ts"
import { getProviderTokens } from "@/session/stateful/get-provider-tokens.ts"
import { isProviderConnected } from "@/session/stateful/is-provider-connected.ts"
import type { SessionStrategy, User } from "@/@types/index.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const createStatefulStrategy = <DefaultUser extends User = User>(
    ctx: InternalStatefulContext
): SessionStrategy<DefaultUser> => {
    return {
        signUp: signUp(ctx),
        signIn: signIn(ctx),
        getSession: getSession(ctx),
        revokeToken: revokeToken(ctx),
        oauthCallback: oauthCallback(ctx),
        createSession: createSession(ctx),
        revokeSession: revokeSession(ctx),
        destroySession: destroySession(ctx),
        refreshSession: refreshSession(ctx),
        refreshUserInfo: refreshUserInfo(ctx),
        signInCredentials: signInCredentials(ctx),
        getProviderTokens: getProviderTokens(ctx),
        isProviderConnected: isProviderConnected(ctx),
    }
}
