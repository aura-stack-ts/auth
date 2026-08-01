import { createCookieManager } from "@/session/cookie-manager.ts"
import { __createSession } from "@/session/stateless/createSession.ts"
import { __getSession } from "@/session/stateless/getSession.ts"
import { __destroySession } from "@/session/stateless/destroySession.ts"
import { __oauthCallback } from "@/session/stateless/oauthCallback.ts"
import { __signIn } from "@/session/stateless/signIn.ts"
import { __refreshUserInfo } from "@/session/stateless/refreshUserInfo.ts"
import { __isProviderConnected } from "@/session/stateless/isProviderConnected.ts"
import { __revokeToken } from "@/session/stateless/revokeToken.ts"
import { __refreshSession } from "@/session/stateless/refreshSession.ts"
import { __getProviderTokens } from "@/session/stateless/getProviderTokens.ts"
import type { SessionStrategy, User, JWTStrategyOptions } from "@/@types/index.ts"

export const createStatelessStrategy = <DefaultUser extends User = User>({
    ctx,
    cookies,
}: JWTStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const cookieConfig = createCookieManager(cookies)

    // JWT strategy: stateless tokens cannot be revoked server-side
    const revokeSession = async (_sessionId: string): Promise<void> => {}

    return {
        getSession: __getSession({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        createSession: __createSession({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        getProviderTokens: __getProviderTokens({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        refreshSession: __refreshSession({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        revokeSession,
        revokeToken: __revokeToken({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        isProviderConnected: __isProviderConnected({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        refreshUserInfo: __refreshUserInfo({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        destroySession: __destroySession({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        signIn: __signIn({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
        oauthCallback: __oauthCallback({ ctx: ctx as any, cookies, cookieManager: cookieConfig }),
    }
}
