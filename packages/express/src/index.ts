export { createAuth } from "@/createAuth.ts"
export { toExpressHandler, toExpressResponse, toWebRequest } from "@/lib/handler.ts"
export { withAuth } from "@/lib/with-auth.ts"
export { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"
export type {
    User,
    Session,
    AuthConfig,
    AuthInstance,
    AuthAPI,
    JoseInstance,
    BuiltInOAuthProvider,
    UserShape,
    UserIdentityType,
    EditableShape,
    InferAuthIdentity,
    InferIdentity,
    InferShape,
    OAuthProvider,
    OAuthProviderConfig,
    OAuthProviderCredentials,
    OAuthProviderRecord,
} from "@aura-stack/auth/types"
