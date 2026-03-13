export { createAuth } from "@/createAuth.ts"
export { createSyslogMessage } from "@/logger.ts"
export { builtInOAuthProviders } from "@/oauth/index.ts"
export { createAuthClient, createClient } from "@/client/index.ts"

export type * from "@/client/index.ts"
export type {
    AuthConfig,
    AuthInstance,
    JoseInstance,
    Session,
    User,
    CookieConfig,
    OAuthProvider,
    OAuthProviderConfig,
    OAuthProviderCredentials,
    ErrorType,
    Logger,
    LogLevel,
    TrustedOrigin,
    BuiltInOAuthProvider,
    LiteralUnion,
    AuthAPI,
    Prettify,
} from "@/@types/index.ts"
