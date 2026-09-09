import { createRouter, type RouterConfig } from "@aura-stack/router"
import {
    signInAction,
    signInCredentialsAction,
    callbackAction,
    sessionAction,
    signOutAction,
    csrfTokenAction,
    updateSessionAction,
    signUpAction,
    tokensAction,
    refreshAction,
    revokeAction,
    disconnectAction,
    connectedAction,
} from "@/actions/index.ts"
import { createAuthAPI } from "@/api/index.ts"
import { createContext } from "@/router/context.ts"
import { onErrorHook, onRequestHook } from "@/router/hooks.ts"
import type { ZodObject } from "zod"
import type { EditableShape } from "@/@types/utility.ts"
import type { ZodIdentitySchema } from "@/@types/index.ts"
import type { SchemaRegistryContext } from "@/@types/internal.ts"
import type { AuthConfig, SignUpConfig } from "@/@types/config.ts"
import type { FromShapeToObject, Identities, SchemaTypes } from "@/identity/index.ts"

const createInternalConfig = <
    const Identity extends Identities = EditableShape<ZodIdentitySchema>,
    const SignUpSchema extends SchemaTypes = ZodObject<any>,
>(
    config?: AuthConfig<Identity, SignUpSchema>
): RouterConfig => {
    const context = createContext<Identity, SignUpSchema>(config)
    return {
        basePath: config?.basePath ?? "/auth",
        context: context as unknown as RouterConfig["context"],
        hooks: {
            onRequest: onRequestHook,
            onError: onErrorHook,
        },
    }
}

export const createAuthInstance = <
    const Identity extends Identities = EditableShape<ZodIdentitySchema>,
    const SignUpSchema extends SchemaTypes = ZodObject<any>,
>(
    authConfig: AuthConfig<Identity, SignUpSchema>
) => {
    const config = createInternalConfig<Identity, SignUpSchema>(authConfig)
    const router = createRouter(
        [
            signInAction(config.context.oauth),
            signInCredentialsAction,
            callbackAction(config.context.oauth),
            sessionAction,
            signOutAction,
            csrfTokenAction,
            updateSessionAction(config.context.identity as SchemaRegistryContext),
            signUpAction<Identity, SignUpSchema>(config.context.signUp as SignUpConfig<Identity, SignUpSchema>),
            tokensAction(config.context.oauth),
            refreshAction(config.context.oauth),
            revokeAction(config.context.oauth),
            disconnectAction(config.context.oauth),
            connectedAction(config.context.oauth),
        ],
        config
    )

    return {
        handlers: router,
        jose: config.context.jose,
        api: createAuthAPI<FromShapeToObject<Identity>, SignUpSchema>(config.context),
    }
}
