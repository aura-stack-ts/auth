import { signIn } from "@/session/stateful/signIn.ts"
import { signUp } from "@/session/stateful/signUp.ts"
import { getSession } from "@/session/stateful/getSession.ts"
import { revokeToken } from "@/session/stateful/revokeToken.ts"
import { createSession } from "@/session/stateful/createSession.ts"
import { oauthCallback } from "@/session/stateful/oauthCallback.ts"
import { revokeSession } from "@/session/stateful/revokeSession.ts"
import { destroySession } from "@/session/stateful/destroySession.ts"
import { refreshSession } from "@/session/stateful/refreshSession.ts"
import { refreshUserInfo } from "@/session/stateful/refreshUserInfo.ts"
import { signInCredentials } from "@/session/stateful/signInCredentials.ts"
import { getProviderTokens } from "@/session/stateful/getProviderTokens.ts"
import { isProviderConnected } from "@/session/stateful/isProviderConnected.ts"
import type { SessionStrategy, User, InternalStatefulContext } from "@/@types/index.ts"

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
