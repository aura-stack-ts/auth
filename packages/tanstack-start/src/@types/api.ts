import type { AuthInstance } from "@aura-stack/react"
import type {
    LiteralUnion,
    SignInAPIOptions,
    BuiltInOAuthProvider,
    Prettify,
    SignInCredentialsAPIOptions,
    SignOutAPIOptions,
    UpdateSessionAPIOptions,
    User,
    SignUpAPIOptions,
    GetProviderTokensAPIOptions,
    AccessTokenAPIOptions,
    RefreshUserInfoAPIOptions,
    RevokeTokenAPIOptions,
    DisconnectProviderAPIOptions,
    ProviderConnectedAPIOptions,
} from "@aura-stack/react/types"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/react/identity"
import type {
    SignInAPIReturn,
    SignInCredentialsAPIReturn,
    SignOutAPIReturn,
    UpdateSessionAPIReturn,
    SignUpAPIReturn,
    GetProviderTokensAPIReturn,
    AccessTokenAPIReturn,
    RefreshUserInfoAPIReturn,
    RevokeTokenAPIReturn,
    DisconnectProviderAPIReturn,
    ProviderConnectedAPIReturn,
} from "@aura-stack/react/types"

export type TanstackStartInstance<
    Identity extends Identities = Identities,
    SignUpSchema extends SchemaTypes = SchemaTypes,
> = AuthInstance<FromShapeToObject<Identity>, SignUpSchema>

export type TanstackStartSignInOptions = Prettify<
    Omit<SignInAPIOptions, "headers" | "request"> & { providerId: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartSignInReturn = Prettify<Omit<SignInAPIReturn, "headers" | "toResponse">>

export type TanstackStartSignInCredentialsOptions = Prettify<Omit<SignInCredentialsAPIOptions, "headers" | "request">>

export type TanstackStartSignInCredentialsReturn = Prettify<Omit<SignInCredentialsAPIReturn, "headers" | "toResponse">>

export type TanstackStartSignOutOptions = Prettify<Omit<SignOutAPIOptions, "headers" | "request">>

export type TanstackStartSignOutReturn = Prettify<Omit<SignOutAPIReturn, "headers" | "toResponse">>

export type TanstackStartUpdateSessionOptions<DefaultUser extends User = User> = Prettify<
    Omit<UpdateSessionAPIOptions<DefaultUser>, "headers" | "request">
>

/**
 * @todo is this type correct? The session property should be ignored or not ?
 */
export type TanstackStartUpdateSessionReturn<DefaultUser extends User = User> = Prettify<
    Omit<UpdateSessionAPIReturn<DefaultUser>, "headers" | "toResponse" | "session">
>

export type TanstackStartSignUpOptions<Payload extends Record<string, any> = Record<string, any>> = Prettify<
    Omit<SignUpAPIOptions<Payload>, "headers" | "request">
>

export type TanstackStartSignUpReturn = Prettify<Omit<SignUpAPIReturn, "headers" | "toResponse">>

export type TanstackStartGetProviderTokensOptions = Prettify<
    Omit<GetProviderTokensAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartGetProviderTokensReturn = Prettify<Omit<GetProviderTokensAPIReturn, "headers" | "toResponse">>

export type TanstackStartGetAccessTokenOptions = Prettify<
    Omit<AccessTokenAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartGetAccessTokenReturn = Prettify<Omit<AccessTokenAPIReturn, "headers" | "toResponse">>

export type TanstackStartRefreshUserInfoOptions = Prettify<
    Omit<RefreshUserInfoAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartRefreshUserInfoReturn<DefaultUser extends User = User> = Prettify<
    Omit<RefreshUserInfoAPIReturn<DefaultUser>, "headers" | "toResponse">
>

export type TanstackStartRevokeTokenOptions = Prettify<
    Omit<RevokeTokenAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartRevokeTokenReturn = Prettify<Omit<RevokeTokenAPIReturn, "headers" | "toResponse">>

export type TanstackStartDisconnectProviderOptions = Prettify<
    Omit<DisconnectProviderAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartDisconnectProviderReturn = Prettify<Omit<DisconnectProviderAPIReturn, "headers" | "toResponse">>

export type TanstackStartIsProviderConnectedOptions = Prettify<
    Omit<ProviderConnectedAPIOptions, "headers" | "request"> & { oauth: LiteralUnion<BuiltInOAuthProvider> }
>

export type TanstackStartIsProviderConnectedReturn = Prettify<Omit<ProviderConnectedAPIReturn, "headers" | "toResponse">>
