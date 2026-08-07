import { zod } from "@aura-stack/react/identity/zod"
import type { AuthInstance, Session } from "@aura-stack/react"
import type { OptionalFetcher, RequiredFetcher } from "@tanstack/react-start"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/react/identity"
import type { TanstackStartSignInCredentialsOptions, TanstackStartSignOutOptions } from "@/@types/api.ts"
import type {
    BuiltInOAuthProvider,
    CredentialsPayload,
    DeepPartial,
    Handlers,
    InferSchema,
    LiteralUnion,
    OAuthTokenPayload,
    RemoveIndexSignature,
    Wrap,
} from "@aura-stack/react/types"

export type * from "@/@types/api.ts"
export type * from "@/@types/core.ts"

type GetSession<Identity extends Identities> = OptionalFetcher<
    undefined,
    undefined,
    Promise<Session<FromShapeToObject<Identity>> | null>
>

type SignIn = RequiredFetcher<
    undefined,
    (data: {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        providerId: LiteralUnion<BuiltInOAuthProvider>
    }) => {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        providerId: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{
        redirect: boolean
        success: boolean
        signInURL: string | null
    }>
>

type SignInCredentials = RequiredFetcher<
    undefined,
    (data: TanstackStartSignInCredentialsOptions) => {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        payload: CredentialsPayload
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
    },
    Promise<{
        redirect: boolean
        success: boolean
        redirectURL: string | null
    }>
>

type SignOut = OptionalFetcher<
    undefined,
    (data?: TanstackStartSignOutOptions) => {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
    },
    Promise<{
        redirect: boolean
        success: boolean
        redirectURL: string | null
    }>
>

type UpdateSession<Identity extends Identities> = RequiredFetcher<
    undefined,
    (data: {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        session: DeepPartial<Session<FromShapeToObject<Identity>>>
    }) => {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        session: DeepPartial<Session<FromShapeToObject<Identity>>>
    },
    Promise<{
        redirect: boolean
        success: boolean
        redirectURL: string | null
    }>
>

type GetProviderTokens = RequiredFetcher<
    undefined,
    (data: { oauth: LiteralUnion<BuiltInOAuthProvider> }) => {
        oauth: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{
        success: boolean
        tokens: OAuthTokenPayload | null
    }>
>
type GetAccessToken = RequiredFetcher<
    undefined,
    (data: { oauth: LiteralUnion<BuiltInOAuthProvider> }) => {
        oauth: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{
        success: boolean
        accessToken: string | null
    }>
>

type DisconnectProvider = RequiredFetcher<
    undefined,
    (data: {
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        oauth: LiteralUnion<BuiltInOAuthProvider>
    }) => {
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        oauth: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{ success: boolean }>
>

type IsProviderConnected = RequiredFetcher<
    undefined,
    (data: { oauth: LiteralUnion<BuiltInOAuthProvider> }) => {
        oauth: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{
        success: boolean
        connected: boolean
    }>
>

type RevokeToken = RequiredFetcher<
    undefined,
    (data: {
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        oauth: LiteralUnion<BuiltInOAuthProvider>
    }) => {
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
        oauth: LiteralUnion<BuiltInOAuthProvider>
    },
    Promise<{ success: boolean }>
>

type RefreshUserInfo<Identity extends Identities> = OptionalFetcher<
    undefined,
    any,
    Promise<{
        success: boolean
        session: Session<FromShapeToObject<Identity>> | null
    }>
>

type SignUp<SignUpSchema extends SchemaTypes = zod.ZodObject<any>> = RequiredFetcher<
    undefined,
    (data: {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        payload: Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
    }) => {
        redirect?: boolean | undefined
        redirectTo?: string | undefined
        payload: Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>
        skipCSRFCheck?: boolean | undefined
        doubleSubmitToken?: string | undefined
    },
    Promise<{
        redirect: boolean
        success: boolean
        redirectURL: string | null
    }>
>

export type TanstackStartInstance<Identity extends Identities = Identities, SignUpSchema extends SchemaTypes = SchemaTypes> = {
    core: AuthInstance<FromShapeToObject<Identity>, SignUpSchema>
    api: {
        getSession: GetSession<Identity>
        signIn: SignIn
        signInCredentials: SignInCredentials
        signOut: SignOut
        updateSession: UpdateSession<Identity>
        signUp: SignUp<SignUpSchema>
        getProviderTokens: GetProviderTokens
        getAccessToken: GetAccessToken
        refreshUserInfo: RefreshUserInfo<Identity>
        revokeToken: RevokeToken
        disconnectProvider: DisconnectProvider
        isProviderConnected: IsProviderConnected
    }
    handlers: Handlers
}
