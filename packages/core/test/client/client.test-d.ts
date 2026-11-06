import { describe, expectTypeOf, test } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import type {
    Session,
    User,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInCredentialsOptions,
    SignInCredentialsReturn,
    SignInOptions,
    SignInReturn,
    SignOutOptions,
    SignOutReturn,
    SignUpOptions,
    SignUpReturn,
    UpdateSessionOptions,
    UpdateSessionReturn,
    InferUser,
    InferSignUp,
    UserFrom,
    GetProviderTokensReturn,
    SendVerificationEmailData,
    VerifyEmailData,
    ForgotPasswordData,
    ResetPasswordData,
    ChangePasswordData,
    ChangeEmailData,
    VerifyEmailChangeData,
    CancelEmailChangeData,
    SendMagicLinkData,
    VerifyMagicLinkData,
} from "@/@types/index.ts"
import { createAuth } from "@/createAuth.ts"
import { z } from "zod/v4"
import { type } from "arktype"
import * as valibot from "valibot"
import * as typebox from "typebox"
import { identitySchema as UserIdentity } from "@/identity/zod.ts"
import { identitySchema as UserIdentityArkType } from "@/identity/arktype.ts"
import { identitySchema as UserIdentityTypeBox } from "@/identity/typebox.ts"
import { identitySchema as UserIdentityValibot } from "@/identity/valibot.ts"

type AuthClientReturn<DefaultUser extends User = User, SignUpUser extends Record<string, any> = Record<string, any>> = {
    getSession: () => Promise<Session<DefaultUser> | null>
    signIn: <Options extends SignInOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options | undefined
    ) => Promise<SignInReturn<Options>>
    signInCredentials: <Options extends SignInCredentialsOptions>(options: Options) => Promise<SignInCredentialsReturn<Options>>
    signUp: <Options extends SignUpOptions<SignUpUser>>(options: Options) => Promise<SignUpReturn<Options>>
    updateSession: <Options extends UpdateSessionOptions<DefaultUser>>(
        options: Options
    ) => Promise<UpdateSessionReturn<Options, DefaultUser>>
    getProviderTokens: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<GetProviderTokensReturn>
    getAccessToken: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<string | null>
    refreshUserInfo: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<Session<DefaultUser> | null>
    revokeToken: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<boolean>
    disconnectProvider: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<boolean>
    isProviderConnected: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<boolean>
    signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
    sendVerificationEmail: (email: string, options?: { redirectTo?: string }) => Promise<SendVerificationEmailData>
    verifyEmail: (token: string, options?: { redirectTo?: string }) => Promise<VerifyEmailData>
    forgotPassword: (email: string, options?: { redirectTo?: string }) => Promise<ForgotPasswordData>
    resetPassword: (options: {
        payload: { token: string; newPassword: string }
        redirectTo?: string
    }) => Promise<ResetPasswordData>
    changePassword: (options: {
        payload: { currentPassword: string; newPassword: string }
        redirectTo?: string
    }) => Promise<ChangePasswordData>
    changeEmail: (options: {
        payload: { currentPassword: string; newEmail: string }
        redirectTo?: string
    }) => Promise<ChangeEmailData>
    verifyEmailChange: (options: { payload: { token: string }; redirectTo?: string }) => Promise<VerifyEmailChangeData>
    cancelEmailChange: (options?: { payload?: { token: string }; redirectTo?: string }) => Promise<CancelEmailChangeData>
    sendMagicLink: (email: string, options?: { redirectTo?: string }) => Promise<SendMagicLinkData>
    verifyMagicLink: (token: string, options?: { redirectTo?: string }) => Promise<VerifyMagicLinkData>
}

describe("Client Types", () => {
    test("createAuthClient returns the correct type", () => {
        const authClient = createAuthClient({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn>()
    })

    test("with custom zod identity schema", () => {
        const schema = UserIdentity.extend({
            isAdmin: z.boolean(),
            role: z.enum(["admin", "user"]),
        })

        const auth = createAuth({
            identity: {
                schema,
            },
        })

        type Expected = {
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }
        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<Expected>()
        expectTypeOf<UserFrom<typeof schema>>().toEqualTypeOf<Expected>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User>>()
    })

    test("with custom valibot identity schema", () => {
        const schema = valibot.object({
            ...UserIdentityValibot.entries,
            isAdmin: valibot.boolean(),
            role: valibot.union([valibot.literal("admin"), valibot.literal("user")]),
        })

        const auth = createAuth({
            identity: {
                schema,
            },
        })

        type Expected = {
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }
        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<Expected>()
        expectTypeOf<UserFrom<typeof schema>>().toEqualTypeOf<Expected>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User>>()
    })

    test("with custom arktype identity schema", () => {
        const schema = UserIdentityArkType.and({
            isAdmin: "boolean",
            role: type.enumerated("admin", "user"),
        })

        const auth = createAuth({
            identity: {
                schema,
            },
        })

        type Expected = {
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }
        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<Expected>()
        expectTypeOf<UserFrom<typeof schema>>().toEqualTypeOf<Expected>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User>>()
    })

    test("with custom typebox identity schema", () => {
        /**
         * NOTE: Currently, the TypeBox schema is not correctly inferred due to the expensive nature
         * of the Static type from "typebox". This is a known issue and we're looking into ways to optimize
         * the type inference for TypeBox schemas in the future.
         */
        const schema = typebox.Type.Object({
            ...UserIdentityTypeBox.properties,
            isAdmin: typebox.Type.Boolean(),
            role: typebox.Type.Union([typebox.Type.Literal("admin"), typebox.Type.Literal("user")]),
        })

        createAuth({
            identity: {
                schema,
            },
        })

        type User = typebox.Static<typeof schema>

        expectTypeOf<User>().toEqualTypeOf<{
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User>>()
    })

    test("with custom zod signUp schema", () => {
        const auth = createAuth({
            signUp: {
                schema: z.object({
                    username: z.string(),
                    nickname: z.string(),
                    password: z.string(),
                }),
                onCreateUser: () => null,
            },
        })
        type SignUp = InferSignUp<typeof auth>
        expectTypeOf<SignUp>().toEqualTypeOf<{
            username: string
            nickname: string
            password: string
        }>()

        const authClient = createAuthClient<User, SignUp>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User, SignUp>>()
    })

    test("with custom valibot signUp schema", () => {
        const auth = createAuth({
            signUp: {
                schema: valibot.object({
                    username: valibot.string(),
                    nickname: valibot.string(),
                    password: valibot.string(),
                }),
                onCreateUser: () => null,
            },
        })
        type SignUp = InferSignUp<typeof auth>
        expectTypeOf<SignUp>().toEqualTypeOf<{
            username: string
            nickname: string
            password: string
        }>()

        const authClient = createAuthClient<User, SignUp>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User, SignUp>>()
    })

    test("with custom arktype signUp schema", () => {
        const auth = createAuth({
            signUp: {
                schema: type({
                    username: "string",
                    nickname: "string",
                    password: "string",
                }),
                onCreateUser: () => null,
            },
        })
        type SignUp = InferSignUp<typeof auth>
        expectTypeOf<SignUp>().toEqualTypeOf<{
            username: string
            nickname: string
            password: string
        }>()

        const authClient = createAuthClient<User, SignUp>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User, SignUp>>()
    })

    test("with custom typebox signUp schema", () => {
        const schema = typebox.Type.Object({
            username: typebox.Type.String(),
            nickname: typebox.Type.String(),
            password: typebox.Type.String(),
        })

        createAuth({
            signUp: {
                schema,
                onCreateUser: () => null,
            },
        })
        type SignUp = typebox.Static<typeof schema>
        expectTypeOf<SignUp>().toEqualTypeOf<{
            username: string
            nickname: string
            password: string
        }>()

        const authClient = createAuthClient<User, SignUp>({})
        expectTypeOf(authClient).toEqualTypeOf<AuthClientReturn<User, SignUp>>()
    })
})

describe("New client method types", () => {
    const client = createAuthClient({})

    test("sendVerificationEmail returns SendVerificationEmailData", () => {
        expectTypeOf(client.sendVerificationEmail).toBeFunction()
        expectTypeOf(client.sendVerificationEmail).parameters.toEqualTypeOf<[email: string, options?: { redirectTo?: string }]>()
        expectTypeOf(client.sendVerificationEmail).returns.resolves.toEqualTypeOf<SendVerificationEmailData>()
    })

    test("verifyEmail returns VerifyEmailData", () => {
        expectTypeOf(client.verifyEmail).toBeFunction()
        expectTypeOf(client.verifyEmail).parameters.toEqualTypeOf<[token: string, options?: { redirectTo?: string }]>()
        expectTypeOf(client.verifyEmail).returns.resolves.toEqualTypeOf<VerifyEmailData>()
    })

    test("forgotPassword returns ForgotPasswordData", () => {
        expectTypeOf(client.forgotPassword).toBeFunction()
        expectTypeOf(client.forgotPassword).parameters.toEqualTypeOf<[email: string, options?: { redirectTo?: string }]>()
        expectTypeOf(client.forgotPassword).returns.resolves.toEqualTypeOf<ForgotPasswordData>()
    })

    test("resetPassword returns ResetPasswordData", () => {
        expectTypeOf(client.resetPassword).toBeFunction()
        expectTypeOf(client.resetPassword).parameters.toEqualTypeOf<
            [options: { payload: { token: string; newPassword: string }; redirectTo?: string }]
        >()
        expectTypeOf(client.resetPassword).returns.resolves.toEqualTypeOf<ResetPasswordData>()
    })

    test("changePassword returns ChangePasswordData", () => {
        expectTypeOf(client.changePassword).toBeFunction()
        expectTypeOf(client.changePassword).parameters.toEqualTypeOf<
            [options: { payload: { currentPassword: string; newPassword: string }; redirectTo?: string }]
        >()
        expectTypeOf(client.changePassword).returns.resolves.toEqualTypeOf<ChangePasswordData>()
    })

    test("changeEmail returns ChangeEmailData", () => {
        expectTypeOf(client.changeEmail).toBeFunction()
        expectTypeOf(client.changeEmail).parameters.toEqualTypeOf<
            [options: { payload: { currentPassword: string; newEmail: string }; redirectTo?: string }]
        >()
        expectTypeOf(client.changeEmail).returns.resolves.toEqualTypeOf<ChangeEmailData>()
    })

    test("verifyEmailChange returns VerifyEmailChangeData", () => {
        expectTypeOf(client.verifyEmailChange).toBeFunction()
        expectTypeOf(client.verifyEmailChange).parameters.toEqualTypeOf<
            [options: { payload: { token: string }; redirectTo?: string }]
        >()
        expectTypeOf(client.verifyEmailChange).returns.resolves.toEqualTypeOf<VerifyEmailChangeData>()
    })

    test("cancelEmailChange returns CancelEmailChangeData", () => {
        expectTypeOf(client.cancelEmailChange).toBeFunction()
        expectTypeOf(client.cancelEmailChange).parameters.toEqualTypeOf<
            [options?: { payload?: { token: string }; redirectTo?: string }]
        >()
        expectTypeOf(client.cancelEmailChange).returns.resolves.toEqualTypeOf<CancelEmailChangeData>()
    })

    test("sendMagicLink returns SendMagicLinkData", () => {
        expectTypeOf(client.sendMagicLink).toBeFunction()
        expectTypeOf(client.sendMagicLink).parameters.toEqualTypeOf<[email: string, options?: { redirectTo?: string }]>()
        expectTypeOf(client.sendMagicLink).returns.resolves.toEqualTypeOf<SendMagicLinkData>()
    })

    test("verifyMagicLink returns VerifyMagicLinkData", () => {
        expectTypeOf(client.verifyMagicLink).toBeFunction()
        expectTypeOf(client.verifyMagicLink).parameters.toEqualTypeOf<[token: string, options?: { redirectTo?: string }]>()
        expectTypeOf(client.verifyMagicLink).returns.resolves.toEqualTypeOf<VerifyMagicLinkData>()
    })
})
