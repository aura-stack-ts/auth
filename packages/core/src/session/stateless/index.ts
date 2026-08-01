import { signIn } from "@/session/stateless/signIn.ts"
import { getSession } from "@/session/stateless/getSession.ts"
import { revokeToken } from "@/session/stateless/revokeToken.ts"
import { oauthCallback } from "@/session/stateless/oauthCallback.ts"
import { createSession } from "@/session/stateless/createSession.ts"
import { destroySession } from "@/session/stateless/destroySession.ts"
import { refreshSession } from "@/session/stateless/refreshSession.ts"
import { refreshUserInfo } from "@/session/stateless/refreshUserInfo.ts"
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
        getSession: getSession(ctx),
        createSession: createSession(ctx),
        getProviderTokens: getProviderTokens(ctx),
        refreshSession: refreshSession(ctx),
        revokeSession,
        revokeToken: revokeToken(ctx),
        isProviderConnected: isProviderConnected(ctx),
        refreshUserInfo: refreshUserInfo(ctx),
        destroySession: destroySession(ctx),
        signIn: signIn(ctx),
        oauthCallback: oauthCallback(ctx),
    }
}
