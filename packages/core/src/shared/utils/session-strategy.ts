import { isNullOrUndefined } from "@/shared/assert.ts"
import { createFingerprint, getDeviceInfo } from "@/shared/utils.ts"
import type { ExpirationStrategy, InternalExpirationResult, InternalStatefulContext } from "@/@types/index.ts"

/** Default sliding threshold: extend when less than 25% of maxAge remains. */
export const DEFAULT_SLIDING_THRESHOLD_RATIO = 0.25

/** Default touch threshold: write lastActivityAt at most once per 5 minutes. */
export const DEFAULT_TOUCH_THRESHOLD_MS = 5 * 60 * 1000

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
    strategy: ExpirationStrategy
}): Date | null => {
    if (isNullOrUndefined(exp)) return null
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

export const ceiling = (candidateMs: number, createdAtMs: number | undefined, maxDurationMs: number | undefined): Date => {
    if (maxDurationMs === undefined || createdAtMs === undefined) {
        return new Date(candidateMs)
    }
    const ceilingMs = createdAtMs + maxDurationMs
    return new Date(Math.min(candidateMs, ceilingMs))
}

export const verifyDebounceLastActivity = (
    now: number,
    lastActivityAt: number,
    /**
     * @todo add a new option for touch threshold in stateful sessions
     */
    threshold: number = DEFAULT_TOUCH_THRESHOLD_MS
): boolean => {
    return now - lastActivityAt > threshold
}

export const calcExpiration = ({
    now,
    expiresAt,
    maxAge,
    strategy,
    slidingThreshold = DEFAULT_SLIDING_THRESHOLD_RATIO,
    createdAt,
    maxDuration,
}: {
    now: number
    expiresAt: number
    maxAge: number
    strategy: ExpirationStrategy
    /**
     * @todo add a new option for slidingThreshold in stateful sessions
     */
    slidingThreshold?: number
    createdAt?: number
    maxDuration?: number
}): InternalExpirationResult => {
    const remaining = expiresAt - now
    if (remaining <= 0) {
        return { action: "invalid" }
    }
    if (maxDuration !== undefined && createdAt !== undefined) {
        const ageMs = now - createdAt
        if (ageMs >= maxDuration) {
            return { action: "no_change" }
        }
    }

    switch (strategy) {
        case "fixed":
        case "absolute":
            return { action: "no_change" }
        case "rolling": {
            const candidateMs = now + maxAge
            return {
                action: "extend",
                expiresAt: ceiling(candidateMs, createdAt, maxDuration),
            }
        }
        case "sliding": {
            const threshold = maxAge * slidingThreshold
            if (remaining < threshold) {
                const candidateMs = now + maxAge
                return {
                    action: "extend",
                    expiresAt: ceiling(candidateMs, createdAt, maxDuration),
                }
            }
            return { action: "touch" }
        }
        default:
            return { action: "no_change" }
    }
}

export const calcStatelessExpiration = ({
    exp,
    maxAge,
    strategy,
    slidingThreshold,
    now = Date.now(),
}: {
    exp: number | undefined | null
    maxAge: number
    strategy: ExpirationStrategy
    slidingThreshold?: number
    now?: number
}): InternalExpirationResult => {
    if (exp == null) return { action: "invalid" }

    const output = calcExpiration({
        now: now,
        expiresAt: exp * 1000,
        maxAge: maxAge * 1000,
        strategy,
        slidingThreshold,
    })

    if (output.action === "touch") return { action: "no_change" }

    return output
}

export const calcStatefulExpiration = ({
    expiresAt,
    createdAt,
    maxAge,
    maxDuration,
    strategy,
    slidingThreshold,
    now = Date.now(),
}: {
    expiresAt: Date
    createdAt?: Date
    maxAge: number
    maxDuration?: number
    strategy: ExpirationStrategy
    slidingThreshold?: number
    now?: number
}): InternalExpirationResult => {
    return calcExpiration({
        now: now,
        expiresAt: expiresAt.getTime(),
        maxAge: maxAge * 1000,
        strategy,
        slidingThreshold,
        createdAt: createdAt?.getTime(),
        maxDuration: maxDuration !== undefined ? maxDuration * 1000 : undefined,
    })
}
