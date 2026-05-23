import { safeParse } from "valibot"
import { fetcher } from "@/shared/fetcher.ts"
import { formHeaders, toFormBody } from "@/shared/form.ts"
import { getUserInfo } from "@/actions/userinfo.ts"
import { DeviceAuthError, DeviceOAuthError } from "@/shared/errors.ts"
import { resolveUrl } from "@/shared/url.ts"
import { sleep } from "@/shared/sleep.ts"
import {
    DEFAULT_POLL_INTERVAL_SECONDS,
    DEVICE_CODE_GRANT,
    SLOW_DOWN_INTERVAL_INCREMENT_SECONDS,
} from "@/shared/constants.ts"
import { OAuthDeviceAccessTokenResponse, OAuthDeviceTokenErrorResponse } from "@/schemas.ts"
import type { BuiltInDeviceProvider } from "@/providers/index.ts"
import type { AppContext, DeviceSession, LiteralUnion, PollOptions } from "@/@types/index.ts"

const DEFAULT_EXPLICIT_POLL_TIMEOUT_MS = 30 * 60 * 1000

interface PollInput {
    providerId: LiteralUnion<BuiltInDeviceProvider>
    deviceCode: string
    intervalMs: number
    deadline: number
}

const resolvePollInput = (context: AppContext, options?: PollOptions): PollInput => {
    if (options?.providerId && options?.deviceCode) {
        const provider = context.providers[options.providerId]
        if (!provider) {
            throw new DeviceAuthError("INVALID_PROVIDER", `Provider with id ${options.providerId} not found`)
        }
        const intervalMs = (options.interval ?? DEFAULT_POLL_INTERVAL_SECONDS) * 1000
        const deadline = Date.now() + (options.timeout ?? DEFAULT_EXPLICIT_POLL_TIMEOUT_MS)
        return {
            providerId: options.providerId,
            deviceCode: options.deviceCode,
            intervalMs,
            deadline,
        }
    }

    if (options?.providerId || options?.deviceCode) {
        throw new DeviceAuthError(
            "INVALID_POLL_INPUT",
            "Both providerId and deviceCode are required when passing explicit poll options."
        )
    }

    const pending = context.getPending?.()
    if (!pending) {
        throw new DeviceAuthError(
            "NO_PENDING_AUTHORIZATION",
            "No pending device authorization. Call authorize() first or pass providerId and deviceCode to poll()."
        )
    }

    return {
        providerId: pending.providerId,
        deviceCode: pending.deviceCode,
        intervalMs: (options?.interval ?? pending.interval) * 1000,
        deadline: options?.timeout !== undefined ? Date.now() + options.timeout : pending.expiresAt,
    }
}

export const poll = (context: AppContext) => {
    return async (options?: PollOptions): Promise<DeviceSession> => {
        const { providerId, deviceCode, intervalMs: initialIntervalMs, deadline } = resolvePollInput(context, options)
        const provider = context.providers[providerId]
        if (!provider) {
            throw new DeviceAuthError("INVALID_PROVIDER", `Provider with id ${providerId} not found`)
        }

        const tokenURL = resolveUrl(provider.accessToken)
        let intervalMs = initialIntervalMs

        while (Date.now() < deadline) {
            const response = await fetcher(tokenURL, {
                method: "POST",
                headers: formHeaders(),
                body: toFormBody({
                    grant_type: DEVICE_CODE_GRANT,
                    device_code: deviceCode,
                    client_id: provider.clientId,
                }),
            })

            const json = await response.json()
            const errorResult = safeParse(OAuthDeviceTokenErrorResponse, json)

            if (errorResult.success) {
                const { error, error_description } = errorResult.output
                if (error === "authorization_pending") {
                    await sleep(intervalMs)
                    continue
                }
                if (error === "slow_down") {
                    intervalMs += SLOW_DOWN_INTERVAL_INCREMENT_SECONDS * 1000
                    await sleep(intervalMs)
                    continue
                }
                throw new DeviceOAuthError(error, error_description ?? error)
            }

            if (!response.ok) {
                const message =
                    typeof json === "object" && json !== null && "error_description" in json
                        ? String((json as { error_description: string }).error_description)
                        : `Token request failed (${response.status}).`
                throw new DeviceOAuthError("server_error", message)
            }

            const tokenResult = safeParse(OAuthDeviceAccessTokenResponse, json)
            if (!tokenResult.success) {
                throw new DeviceOAuthError("invalid_request", "Failed to parse device token response")
            }

            const { access_token, token_type, expires_in, refresh_token, scope } = tokenResult.output
            const user = await getUserInfo(provider, access_token)

            context.setPending?.(null)

            return {
                accessToken: access_token,
                tokenType: token_type,
                expiresIn: expires_in,
                refreshToken: refresh_token,
                scope,
                user,
            }
        }

        throw new DeviceAuthError("POLL_TIMEOUT", "Device authorization polling timed out before the user completed authorization.")
    }
}
