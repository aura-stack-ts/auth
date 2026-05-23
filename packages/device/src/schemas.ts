import * as valibot from "valibot"

export const DeviceAuthorizationConfigSchema = valibot.union([
    valibot.pipe(valibot.string(), valibot.url()),
    valibot.object({
        url: valibot.pipe(valibot.string(), valibot.url()),
        params: valibot.optional(valibot.object({ scope: valibot.optional(valibot.string()) })),
    }),
])

export const DeviceProviderCredentialsSchema = valibot.object({
    id: valibot.string(),
    name: valibot.string(),
    deviceAuthorization: DeviceAuthorizationConfigSchema,
    accessToken: valibot.union([valibot.pipe(valibot.string(), valibot.url())]),
    userInfo: valibot.union([valibot.pipe(valibot.string(), valibot.url())]),
    clientId: valibot.pipe(valibot.string(), valibot.minLength(1)),
    scope: valibot.optional(valibot.string()),
})

export const OAuthDeviceAuthorizationResponse = valibot.object({
    device_code: valibot.string(),
    user_code: valibot.string(),
    verification_uri: valibot.string(),
    verification_uri_complete: valibot.optional(valibot.string()),
    expires_in: valibot.number(),
    interval: valibot.optional(valibot.number()),
})

export const OAuthDeviceTokenErrorResponse = valibot.object({
    error: valibot.picklist(["authorization_pending", "slow_down", "expired_token", "access_denied"]),
    error_description: valibot.optional(valibot.string()),
})

export const OAuthDeviceAccessTokenResponse = valibot.object({
    access_token: valibot.string(),
    token_type: valibot.string(),
    expires_in: valibot.optional(valibot.number()),
    refresh_token: valibot.optional(valibot.string()),
    scope: valibot.optional(valibot.string()),
})
