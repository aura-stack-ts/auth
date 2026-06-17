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
} from "@/@types/index.ts"
import { createAuth } from "@/createAuth.ts"
import { z } from "zod/v4"
import { type } from "arktype"
import * as valibot from "valibot"
import * as typebox from "typebox"
import { UserIdentity, UserIdentityArkType, UserIdentityTypeBox, UserIdentityValibot } from "@/shared/identity.ts"

describe("Client Types", () => {
    test("createAuthClient returns the correct type", () => {
        const authClient = createAuthClient({})
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<Record<string, any>>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom zod identity schema", () => {
        const auth = createAuth({
            oauth: [],
            identity: {
                schema: UserIdentity.extend({
                    isAdmin: z.boolean(),
                    role: z.enum(["admin", "user"]),
                }),
            },
        })

        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<{
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<Record<string, any>>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom valibot identity schema", () => {
        const auth = createAuth({
            oauth: [],
            identity: {
                schema: valibot.object({
                    ...UserIdentityValibot.entries,
                    isAdmin: valibot.boolean(),
                    role: valibot.union([valibot.literal("admin"), valibot.literal("user")]),
                }),
            },
        })

        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<{
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<Record<string, any>>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom arktype identity schema", () => {
        const auth = createAuth({
            oauth: [],
            identity: {
                schema: UserIdentityArkType.and({
                    isAdmin: "boolean",
                    role: type.enumerated("admin", "user"),
                }),
            },
        })

        type User = InferUser<typeof auth>

        expectTypeOf<User>().toEqualTypeOf<{
            sub: string
            name?: string | null | undefined
            image?: string | null | undefined
            email?: string | null | undefined
            isAdmin: boolean
            role: "admin" | "user"
        }>()

        const authClient = createAuthClient<User>({})
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<Record<string, any>>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
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
            oauth: [],
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
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<Record<string, any>>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom zod signUp schema", () => {
        const auth = createAuth({
            oauth: [],
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
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<SignUp>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom valibot signUp schema", () => {
        const auth = createAuth({
            oauth: [],
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
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<SignUp>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom arktype signUp schema", () => {
        const auth = createAuth({
            oauth: [],
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
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<SignUp>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })

    test("with custom arktype signUp schema", () => {
        const schema = typebox.Type.Object({
            username: typebox.Type.String(),
            nickname: typebox.Type.String(),
            password: typebox.Type.String(),
        })

        createAuth({
            oauth: [],
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
        expectTypeOf(authClient).toEqualTypeOf<{
            getSession: () => Promise<Session<User> | null>
            signIn: <Options extends SignInOptions>(
                oauth: LiteralUnion<BuiltInOAuthProvider>,
                options?: Options | undefined
            ) => Promise<SignInReturn<Options>>
            signInCredentials: <Options extends SignInCredentialsOptions>(
                options: Options
            ) => Promise<SignInCredentialsReturn<Options>>
            signUp: <Options extends SignUpOptions<SignUp>>(options: Options) => Promise<SignUpReturn<Options>>
            updateSession: <Options extends UpdateSessionOptions<User>>(
                options: Options
            ) => Promise<UpdateSessionReturn<Options, User>>
            signOut: <Options extends SignOutOptions>(options?: Options) => Promise<SignOutReturn<Options>>
        }>()
    })
})
