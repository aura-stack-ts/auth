import { poll } from "@/actions/poll.ts"
import { authorize } from "@/actions/authorize.ts"
import { createBuiltInOAuthProviders } from "@/providers/index.ts"
import type { AuthInstance, DeviceClientOptions, PendingDeviceAuth } from "@/@types/config.ts"

/**
 * Creates a device authorization client for RFC 8628 OAuth device flows.
 *
 * @param config - Provider list (built-in names or full provider configs)
 * @returns Client with `authorize` and `poll` methods
 */
export const createDeviceClient = (config: DeviceClientOptions): AuthInstance => {
    const providers = createBuiltInOAuthProviders(config.providers)
    let pending: PendingDeviceAuth | null = null

    const context = {
        providers,
        getPending: () => pending,
        setPending: (value: PendingDeviceAuth | null) => {
            pending = value
        },
    }

    return {
        authorize: authorize(context),
        poll: poll(context),
    }
}
