import { createJWTManager } from "./jwt-manager.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import type {
    Session,
    SessionStrategy,
    StatelessStrategyConfig,
    User,
    CookieStoreConfig,
    JoseInstance,
    TypedJWTPayload,
} from "@/@types/index.ts"

type JWTStrategyOptions = { config: StatelessStrategyConfig; jose: JoseInstance; cookies: CookieStoreConfig }

export const createJWTStrategy = ({ config, jose, cookies }: JWTStrategyOptions): SessionStrategy => {
    const jwt = createJWTManager(config.jwt!, jose)
    const cookieConfig = createCookieManager(cookies)

    const getSession = async (headers: Headers): Promise<Session | null> => {
        try {
            console.log("cookies-createJWTStrategy-getSession", cookies.sessionToken)
            const { sessionToken } = cookieConfig.getCookie(headers)
            if (!sessionToken) return null

            const decoded = await jwt.verifyToken(sessionToken)
            const { exp, iat: _iat, jti: _jti, nbf: _nbf, aud: _aud, iss: _iss, ...user } = decoded

            if (!user) return null

            return {
                user,
                expires: new Date((exp ?? 0) * 1000).toISOString(),
            }
        } catch (error) {
            console.error("JWT_STRATEGY_GET_SESSION_ERROR", { error })
            return null
        }
    }

    const createSession = async (session: TypedJWTPayload<User>) => jwt.createToken(session)

    /** @todo: implement refresh session logic */
    const refreshSession = async (_headers: Headers): Promise<any> => {}

    const revokeSession = async (_sessionId: string): Promise<void> => {}

    const destroySession = async (_headers: Headers) => cookieConfig.clear()

    return { getSession, createSession, refreshSession, revokeSession, destroySession }
}
