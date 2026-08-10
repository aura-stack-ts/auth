import type { zod } from "@/identity/zod.ts"
import type { RouterContextWithAuth } from "@/lib/with-auth.ts"
import type { AuthInstance, User } from "@aura-stack/auth"
import type { SchemaTypes } from "@aura-stack/auth/types"
import type { RouteParams, RouterContext, Next } from "@oak/oak"

export interface OakInstance<
    DefaultUser extends User = User,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<DefaultUser, SignUpSchema> {
    toHandler: <Route extends string>(ctx: RouterContext<Route, RouteParams<Route>>) => Promise<any>
    withAuth: <Route extends string>(
        ctx: RouterContextWithAuth<Route, RouteParams<Route>, DefaultUser>,
        next: Next
    ) => Promise<any>
}

export type { InferUser, InferSession, InferSignUp } from "@/identity/index.ts"
