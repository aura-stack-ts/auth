import { safeParse } from "valibot"
import { fetcher } from "@/shared/fetcher.ts"
import { toHeaders, toFormBody } from "@/shared/fetcher.ts"
import { DeviceAuthError, DeviceOAuthError } from "@/shared/errors.ts"
import { getResolvedScope, getResolvedURL } from "@/shared/url.ts"
import { DEFAULT_POLL_INTERVAL_SECONDS } from "@/shared/constants.ts"
import { OAuthDeviceAuthorizationResponse } from "@/schemas.ts"
import type { BuiltInDeviceProvider } from "@/providers/index.ts"
import type { AppContext, DeviceAuthorizationResponse, LiteralUnion, PendingDeviceAuth } from "@/@types/index.ts"

export const authorize = (context: AppContext) => {
    return async (providerId: LiteralUnion<BuiltInDeviceProvider>): Promise<DeviceAuthorizationResponse> => {
        const deviceConfig = context.providers[providerId]
        if (!deviceConfig) {
            throw new DeviceAuthError("INVALID_PROVIDER", `Provider with id ${providerId} not found`)
        }

        const url = getResolvedURL(deviceConfig.deviceAuthorization)
        const scope = getResolvedScope(deviceConfig.deviceAuthorization, deviceConfig.scope)
        const bodyParams: Record<string, string> = {
            client_id: deviceConfig.clientId,
        }
        if (scope) {
            bodyParams.scope = scope
        }

        const response = await fetcher(url, {
            method: "POST",
            headers: toHeaders(),
            body: toFormBody(bodyParams),
        })

        const json = await response.json().catch(() => null)
        if (!response.ok) {
            const error = typeof json === "object" && json !== null && "error" in json ? String(json.error) : "server_error"
            const description =
                typeof json === "object" && json !== null && "error_description" in json
                    ? String(json.error_description)
                    : `Device authorization request failed (${response.status}).`
            throw new DeviceOAuthError(error as DeviceOAuthError["error"], description)
        }

        const { success, output } = safeParse(OAuthDeviceAuthorizationResponse, json)
        if (!success) {
            throw new DeviceOAuthError("invalid_request", "Failed to parse device authorization response")
        }

        const interval = output.interval ?? DEFAULT_POLL_INTERVAL_SECONDS
        const authorizationResponse: DeviceAuthorizationResponse = {
            deviceCode: output.device_code,
            userCode: output.user_code,
            verificationURI: output.verification_uri,
            verificationURIComplete: output.verification_uri_complete,
            expiresIn: output.expires_in,
            interval,
        }

        const pending: PendingDeviceAuth = {
            providerId,
            deviceCode: output.device_code,
            interval,
            expiresAt: Date.now() + output.expires_in * 1000,
        }
        context.setPending?.(pending)
        return authorizationResponse
    }
}
