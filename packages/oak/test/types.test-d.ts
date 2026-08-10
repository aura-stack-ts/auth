import { assertType, type IsExact } from "@std/testing/types"
import { createAuth } from "@/createAuth.ts"
import { createSecretValue } from "@aura-stack/auth/crypto"
import { zod, identitySchema, type IdentityShape } from "@aura-stack/auth/identity/zod"
import type {
    Session,
    Wrap,
    UpdateSessionAPIOptions,
    GetSessionAPIReturn,
    RefreshUserInfoAPIReturn,
    SignUpAPIOptions,
} from "@aura-stack/auth/types"
import type { FromShapeToObject } from "@aura-stack/auth/identity"
import type { InferSession, InferUser, InferSignUp } from "@/types/index.ts"

const SECRET_KEY = createSecretValue(44)
const SALT_KEY = createSecretValue(44)

Deno.env.set("AURA_AUTH_SECRET", SECRET_KEY)
Deno.env.set("AURA_AUTH_SALT", SALT_KEY)

Deno.env.set("AURA_AUTH_GITHUB_CLIENT_ID", "github-client-id")
Deno.env.set("AURA_AUTH_GITHUB_CLIENT_SECRET", "github-client-secret")

const auth = createAuth({
    oauth: [],
    identity: {
        schema: identitySchema.extend({
            role: zod.string(),
            nickname: zod.string().optional(),
        }),
    },
})
const { api } = auth
type Identity = FromShapeToObject<IdentityShape & { role: zod.ZodString; nickname: zod.ZodOptional<zod.ZodString> }>
Deno.test("Infer Types", () => {
    assertType<IsExact<InferUser<typeof auth>, Wrap<Identity>>>(true)
    assertType<IsExact<InferSession<typeof auth>, Session<Wrap<Identity>>>>(true)
    assertType<IsExact<InferSignUp<typeof auth>, {}>>(true)
})

Deno.test("api.getSession", () => {
    assertType<IsExact<Awaited<ReturnType<typeof api.getSession>>, GetSessionAPIReturn<Identity>>>(true)
})

Deno.test("api.updateSession", () => {
    assertType<IsExact<Parameters<typeof api.updateSession>[0], UpdateSessionAPIOptions<Identity>>>(true)
})

Deno.test("api.refreshUserInfo", () => {
    assertType<IsExact<ReturnType<typeof api.refreshUserInfo>, Promise<RefreshUserInfoAPIReturn<Identity>>>>(true)
})

Deno.test("api.signUp", () => {
    assertType<IsExact<Parameters<typeof api.signUp>[0], SignUpAPIOptions<Record<string, any>>>>(true)
})
