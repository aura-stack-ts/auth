import { createFingerprint, getDeviceInfo } from "@/shared/utils.ts"
import type { InternalStatefulContext } from "@/@types/index.ts"

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

export const updateExpires = ({
    exp,
    maxAge,
    strategy,
}: {
    exp: number | undefined
    maxAge: number
    strategy: string
}): Date | null => {
    if (!exp) return null
    const now = Math.floor(Date.now() / 1000)
    switch (strategy) {
        case "fixed":
        case "absolute":
            return null
        case "rolling":
            return new Date((now + maxAge) * 1000)
        case "sliding": {
            const threshold = maxAge * 0.25
            if (exp - now < threshold) {
                return new Date((now + maxAge) * 1000)
            }
            return null
        }
        default:
            return null
    }
}
