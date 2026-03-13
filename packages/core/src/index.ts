export { createAuth } from "@/createAuth.ts"

export * from "@/client/index.ts"
export { builtInOAuthProviders } from "@/oauth/index.ts"
export { createSyslogMessage } from "@/logger.ts"

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
