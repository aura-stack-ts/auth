import { createFingerprint, getDeviceInfo } from "@/shared/utils.ts"
import type { InternalStatefulContext } from "@/@types/session.ts"

export const createDevice = ({ ctx: { sessionConfig } }: InternalStatefulContext) => {
    return async (userId: string, request: Request) => {
        const { userAgent, browser, platform, deviceType, ip, name } = getDeviceInfo(request)
        const fingerprint = await createFingerprint(request)
        const device = await sessionConfig.adapter.getDeviceByFingerprint(userId, fingerprint)
        if (device) {
            await sessionConfig.adapter.updateDevice(device.id, { lastSeenAt: new Date() })
            return device
        }

        return await sessionConfig.adapter.createDevice({
            userId,
            userAgent,
            browser,
            platform,
            type: deviceType,
            name,
            lastIp: ip,
            fingerprint,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
            trusted: false,
            metadata: null,
        })
    }
}
