import type { User } from "@/@types/session.ts"
import type { LiteralUnion } from "@/@types/index.ts"
import type { BuiltInDeviceProvider } from "@/providers/index.ts"
import type { DeviceAuthorizationResponse, DeviceProviderCredentials, DeviceSession } from "@/@types/device.ts"

export interface DeviceClientOptions<DefaultUser extends User = User> {
    providers: (BuiltInDeviceProvider | DeviceProviderCredentials<Record<string, unknown>, DefaultUser>)[]
}

export interface PollOptions {
    /** Maximum time in milliseconds to wait for authorization. */
    timeout?: number
    providerId?: LiteralUnion<BuiltInDeviceProvider>
    deviceCode?: string
    /** Minimum seconds between poll requests (overrides server interval). */
    interval?: number
}

export interface AuthInstance {
    authorize(providerId: LiteralUnion<BuiltInDeviceProvider>): Promise<DeviceAuthorizationResponse>
    poll(options?: PollOptions): Promise<DeviceSession>
}

export interface PendingDeviceAuth {
    providerId: LiteralUnion<BuiltInDeviceProvider>
    deviceCode: string
    interval: number
    expiresAt: number
}

export interface AppContext {
    providers: Record<LiteralUnion<BuiltInDeviceProvider>, DeviceProviderCredentials<Record<string, unknown>>>
    getPending?: () => PendingDeviceAuth | null
    setPending?: (pending: PendingDeviceAuth | null) => void
}
