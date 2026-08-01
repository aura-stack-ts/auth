import { signIn } from "@/session/stateless/signIn.ts"
import { signUp } from "@/session/stateless/signUp.ts"
import { getSession } from "@/session/stateless/getSession.ts"
import { revokeToken } from "@/session/stateless/revokeToken.ts"
import { oauthCallback } from "@/session/stateless/oauthCallback.ts"
import { createSession } from "@/session/stateless/createSession.ts"
import { destroySession } from "@/session/stateless/destroySession.ts"
import { refreshSession } from "@/session/stateless/refreshSession.ts"
import { refreshUserInfo } from "@/session/stateless/refreshUserInfo.ts"
import { signInCredentials } from "@/session/stateless/signInCredentials.ts"
import { getProviderTokens } from "@/session/stateless/getProviderTokens.ts"
import { isProviderConnected } from "@/session/stateless/isProviderConnected.ts"
import type { SessionStrategy, User, InternalStatelessContext } from "@/@types/index.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>(
    ctx: InternalStatelessContext
): SessionStrategy<DefaultUser> => {
    const revokeSession = async (_sessionId: string): Promise<void> => {
        ctx.ctx.logger?.log("STATELESS_REVOKE_SESSION_NOOP", {
            structuredData: { strategy: "stateless", reason: "no_server_side_session_record" },
        })
    }

    return {
        revokeSession,
        signIn: signIn(ctx),
        signUp: signUp(ctx),
        getSession: getSession(ctx),
        revokeToken: revokeToken(ctx),
        createSession: createSession(ctx),
        oauthCallback: oauthCallback(ctx),
        refreshSession: refreshSession(ctx),
        destroySession: destroySession(ctx),
        refreshUserInfo: refreshUserInfo(ctx),
        getProviderTokens: getProviderTokens(ctx),
        signInCredentials: signInCredentials(ctx),
        isProviderConnected: isProviderConnected(ctx),
    }
}
