import { createFingerprint, getDeviceInfo } from "@/shared/http/request-metadata.ts"
import type { InternalContextForStateful } from "@/@types/internal.ts"

export const createDevice = ({ session }: InternalContextForStateful) => {
    return async (userId: string, request: Request) => {
        const { userAgent, browser, platform, deviceType, ip, name } = getDeviceInfo(request)
        const fingerprint = await createFingerprint(request)
        const device = await session.config.adapter.getDeviceByFingerprint(userId, fingerprint)
        if (device) {
            await session.config.adapter.updateDevice(device.id, { lastSeenAt: new Date() })
            return device
        }

        return await session.config.adapter.createDevice({
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
            deletedAt: null,
        })
    }
}
