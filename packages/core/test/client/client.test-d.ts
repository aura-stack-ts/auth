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
    SendVerificationEmailOptions,
    SendVerificationEmailReturn,
    VerifyEmailOptions,
    VerifyEmailReturn,
    ForgotPasswordOptions,
    ForgotPasswordReturn,
    ResetPasswordOptions,
    ResetPasswordReturn,
    ChangePasswordOptions,
    ChangePasswordReturn,
    ChangeEmailOptions,
    ChangeEmailReturn,
    VerifyEmailChangeOptions,
    VerifyEmailChangeReturn,
    CancelEmailChangeOptions,
    CancelEmailChangeReturn,
    SendMagicLinkOptions,
    SendMagicLinkReturn,
    VerifyMagicLinkOptions,
    VerifyMagicLinkReturn,
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
    sendVerificationEmail: <Options extends SendVerificationEmailOptions>(
        email: string,
        options?: Options
    ) => Promise<SendVerificationEmailReturn<Options>>
    verifyEmail: <Options extends VerifyEmailOptions>(token: string, options?: Options) => Promise<VerifyEmailReturn<Options>>
    forgotPassword: <Options extends ForgotPasswordOptions>(
        email: string,
        options?: Options
    ) => Promise<ForgotPasswordReturn<Options>>
    resetPassword: <Options extends ResetPasswordOptions>(options: Options) => Promise<ResetPasswordReturn<Options>>
    changePassword: <Options extends ChangePasswordOptions>(options: Options) => Promise<ChangePasswordReturn<Options>>
    changeEmail: <Options extends ChangeEmailOptions>(options: Options) => Promise<ChangeEmailReturn<Options>>
    verifyEmailChange: <Options extends VerifyEmailChangeOptions>(options: Options) => Promise<VerifyEmailChangeReturn<Options>>
    cancelEmailChange: <Options extends CancelEmailChangeOptions>(options?: Options) => Promise<CancelEmailChangeReturn<Options>>
    sendMagicLink: <Options extends SendMagicLinkOptions>(
        email: string,
        options?: Options
    ) => Promise<SendMagicLinkReturn<Options>>
    verifyMagicLink: <Options extends VerifyMagicLinkOptions>(
        token: string,
        options?: Options
    ) => Promise<VerifyMagicLinkReturn<Options>>
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

    test("sendVerificationEmail — redirect: false returns data", () => {
        expectTypeOf(client.sendVerificationEmail<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<SendVerificationEmailReturn<{ redirect: false }>, object>
        >()
    })

    test("sendVerificationEmail — redirect: true returns void", () => {
        expectTypeOf(client.sendVerificationEmail<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })

    test("verifyEmail — redirect: false returns data", () => {
        expectTypeOf(client.verifyEmail<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<VerifyEmailReturn<{ redirect: false }>, object>
        >()
    })

    test("verifyEmail — redirect: true returns void", () => {
        expectTypeOf(client.verifyEmail<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })

    test("forgotPassword — redirect: false returns data", () => {
        expectTypeOf(client.forgotPassword<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<ForgotPasswordReturn<{ redirect: false }>, object>
        >()
    })

    test("forgotPassword — redirect: true returns void", () => {
        expectTypeOf(client.forgotPassword<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })

    test("resetPassword — redirect: false returns data", () => {
        type Opts = { payload: { token: string; newPassword: string }; redirect: false }
        expectTypeOf(client.resetPassword<Opts>).returns.resolves.toEqualTypeOf<ResetPasswordReturn<Opts>>()
    })

    test("resetPassword — redirect: true returns void", () => {
        expectTypeOf(
            client.resetPassword<{ payload: { token: string; newPassword: string }; redirect: true; redirectTo: "/" }>
        ).returns.resolves.toEqualTypeOf<void>()
    })

    test("changePassword — redirect: false returns data", () => {
        type Opts = { payload: { currentPassword: string; newPassword: string }; redirect: false }
        expectTypeOf(client.changePassword<Opts>).returns.resolves.toEqualTypeOf<ChangePasswordReturn<Opts>>()
    })

    test("changePassword — redirect: true returns void", () => {
        expectTypeOf(
            client.changePassword<{ payload: { currentPassword: string; newPassword: string }; redirect: true; redirectTo: "/" }>
        ).returns.resolves.toEqualTypeOf<void>()
    })

    test("changeEmail — redirect: false returns data", () => {
        type Opts = { payload: { currentPassword: string; newEmail: string }; redirect: false }
        expectTypeOf(client.changeEmail<Opts>).returns.resolves.toEqualTypeOf<ChangeEmailReturn<Opts>>()
    })

    test("changeEmail — redirect: true returns void", () => {
        expectTypeOf(
            client.changeEmail<{ payload: { currentPassword: string; newEmail: string }; redirect: true; redirectTo: "/" }>
        ).returns.resolves.toEqualTypeOf<void>()
    })

    test("verifyEmailChange — redirect: false returns data", () => {
        type Opts = { payload: { token: string }; redirect: false }
        expectTypeOf(client.verifyEmailChange<Opts>).returns.resolves.toEqualTypeOf<VerifyEmailChangeReturn<Opts>>()
    })

    test("verifyEmailChange — redirect: true returns void", () => {
        expectTypeOf(
            client.verifyEmailChange<{ payload: { token: string }; redirect: true; redirectTo: "/" }>
        ).returns.resolves.toEqualTypeOf<void>()
    })

    test("cancelEmailChange — redirect: false returns data", () => {
        expectTypeOf(client.cancelEmailChange<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<CancelEmailChangeReturn<{ redirect: false }>, object>
        >()
    })

    test("cancelEmailChange — redirect: true returns void", () => {
        expectTypeOf(client.cancelEmailChange<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })

    test("sendMagicLink — redirect: false returns data", () => {
        expectTypeOf(client.sendMagicLink<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<SendMagicLinkReturn<{ redirect: false }>, object>
        >()
    })

    test("sendMagicLink — redirect: true returns void", () => {
        expectTypeOf(client.sendMagicLink<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })

    test("verifyMagicLink — redirect: false returns data", () => {
        expectTypeOf(client.verifyMagicLink<{ redirect: false }>).returns.resolves.toEqualTypeOf<
            Extract<VerifyMagicLinkReturn<{ redirect: false }>, object>
        >()
    })

    test("verifyMagicLink — redirect: true returns void", () => {
        expectTypeOf(client.verifyMagicLink<{ redirect: true; redirectTo: "/" }>).returns.resolves.toEqualTypeOf<void>()
    })
})
