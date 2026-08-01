import { __createSession } from "@/session/stateful/createSession.ts"
import { __destroySession } from "@/session/stateful/destroySession.ts"
import { __getProviderTokens } from "@/session/stateful/getProviderTokens.ts"
import { __getSession } from "@/session/stateful/getSession.ts"
import { __isProviderConnected } from "@/session/stateful/isProviderConnected.ts"
import { __oauthCallback } from "@/session/stateful/oauthCallback.ts"
import { __refreshSession } from "@/session/stateful/refreshSession.ts"
import { __refreshUserInfo } from "@/session/stateful/refreshUserInfo.ts"
import { __revokeSession } from "@/session/stateful/revokeSession.ts"
import { __revokeToken } from "@/session/stateful/revokeToken.ts"
import { __signIn } from "@/session/stateful/signIn.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type { DatabaseStrategyOptions, SessionStrategy, User } from "@/@types/session.ts"

export const createStatefulStrategy = <DefaultUser extends User = User>({
    cookies,
    ctx,
}: DatabaseStrategyOptions<DefaultUser>): SessionStrategy<DefaultUser> => {
    const cookieManager = createCookieManager(cookies)

    return {
        refreshUserInfo: __refreshUserInfo({ ctx: ctx as any, cookies, cookieManager }),
        getSession: __getSession({ ctx: ctx as any, cookies, cookieManager }),
        createSession: __createSession({ ctx: ctx as any, cookies, cookieManager }),
        refreshSession: __refreshSession({ ctx: ctx as any, cookies, cookieManager }),
        revokeSession: __revokeSession({ ctx: ctx as any, cookies, cookieManager }),
        revokeToken: __revokeToken({ ctx: ctx as any, cookies, cookieManager }),
        destroySession: __destroySession({ ctx: ctx as any, cookies, cookieManager }),
        getProviderTokens: __getProviderTokens({ ctx: ctx as any, cookies, cookieManager }),
        isProviderConnected: __isProviderConnected({ ctx: ctx as any, cookies, cookieManager }),
        signIn: __signIn({ ctx: ctx as any, cookies, cookieManager }),
        oauthCallback: __oauthCallback({ ctx: ctx as any, cookies, cookieManager }),
    }
}
