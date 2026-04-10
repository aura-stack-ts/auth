export { createAuth } from "@/createAuth.ts"
export { toExpressHandler, toExpressResponse, toWebRequest } from "@/lib/handler.ts"
export { withAuth, type LocalsWithSession } from "@/lib/with-auth.ts"
export { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"
export type {
    User,
    Session,
    AuthConfig,
    AuthInstance,
    AuthAPI,
    JoseInstance,
    BuiltInOAuthProvider,
    CookieConfig,
    Logger,
    LogLevel,
    TrustedOrigin,
    SessionConfig,
    CredentialsProvider,
    UserShape,
    UserIdentityType,
    EditableShape,
    InferAuthIdentity,
    InferIdentity,
    InferShape,
    ShapeToObject,
    OAuthProvider,
    OAuthProviderConfig,
    OAuthProviderCredentials,
    OAuthProviderRecord,
} from "@aura-stack/auth/types"
