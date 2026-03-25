export { createAuth } from "@/createAuth.ts"
export { createJoseInstance } from "@/jose.ts"
export { createSyslogMessage } from "@/shared/logger.ts"
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
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignOutAPIOptions,
    JWTConfig,
    JWTKey,
    JWTMode,
    JWTSigningAlgorithm,
    JWTKeyAlgorithm,
    JWTEncryptedMode,
    JWTSignedMode,
    JWTEncryptionAlgorithm,
    JWTSealedMode,
    JWTConfigBase,
    JWTExpirationStrategy,
    StatelessStrategyConfig,
    SessionConfig,
    SessionStrategy,
} from "@/@types/index.ts"
