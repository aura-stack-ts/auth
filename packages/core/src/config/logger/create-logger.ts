import { getEnv, getEnvBoolean } from "@/shared/env.ts"
import { LOG_MESSAGES } from "@/config/logger/catalog.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, Logger, LogLevel, SyslogOptions } from "@/@types/index.ts"
import type { InternalLogger } from "@/@types/internal.ts"

export const createLogEntry = <T extends keyof typeof LOG_MESSAGES>(
    key: T,
    overrides?: Partial<SyslogOptions>
): SyslogOptions => {
    const message = LOG_MESSAGES[key]
    return {
        ...message,
        timestamp: new Date().toISOString(),
        hostname: "aura-auth",
        ...overrides,
    }
}

/**
 * Maps LogLevel to Severity hierarchically per RFC 5424.
 * Each level includes itself and all more-severe levels.
 */
const logLevelToSeverity: Record<LogLevel, string[]> = {
    debug: ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"],
    info: ["info", "notice", "warning", "error", "critical", "alert", "emergency"],
    warn: ["warning", "error", "critical", "alert", "emergency"],
    error: ["error", "critical", "alert", "emergency"],
}

const isValidLogLevel = (value: string | undefined): value is LogLevel => {
    return value === "debug" || value === "info" || value === "warn" || value === "error"
}

const getSeverityLevel = (severity: string): number => {
    const severities: Record<string, number> = {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
    }
    return severities[severity] ?? 6
}

export const createStructuredData = (data: Record<string, string | number | boolean>, sdID = "metadata"): string => {
    const entries = Object.entries(data)
    if (entries.length === 0) return `[${sdID}]`
    const values = entries.map(([key, value]) => `${key}="${String(value).replace(/(["\\\]])/g, "\\$1")}"`).join(" ")
    return `[${sdID} ${values}]`
}

export const createSyslogMessage = (options: SyslogOptions): string => {
    const { timestamp, hostname, appName = "aura-auth", procId = "-", msgId, structuredData, message } = options
    const pri = (options.facility ?? 16) * 8 + getSeverityLevel(options.severity)
    const structuredDataStr = createStructuredData(structuredData ?? {})
    return `<${pri}>1 ${timestamp} ${hostname} ${appName} ${procId} ${msgId} ${structuredDataStr} ${message}`
}

export const createLogger = (logger?: Required<Logger>): InternalLogger | undefined => {
    if (!logger) return undefined
    const level = logger.level
    const allowedSeverities = logLevelToSeverity[level] ?? []

    return {
        level,
        log<T extends keyof typeof LOG_MESSAGES>(key: T, overrides?: Partial<SyslogOptions>) {
            const entry = createLogEntry(key, overrides)
            if (!allowedSeverities.includes(entry.severity)) return entry
            logger.log({
                timestamp: entry.timestamp,
                appName: entry.appName ?? "aura-auth",
                hostname: entry.hostname ?? "aura-auth",
                ...entry,
            })
            return entry
        },
    }
}

/**
 * Creates the logger instance based on the provided configuration and environment variables.
 * Priority: config.logger, LOG_LEVEL env, DEBUG env and defaults to undefined if logging is not enabled.
 */
export const createProxyLogger = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config?: AuthConfig<Identity, SignUpSchema>
) => {
    const level = getEnv("LOG_LEVEL")
    const debug = getEnvBoolean("DEBUG")
    if (typeof config?.logger === "object") {
        return createLogger({
            log: config.logger?.log || createSyslogMessage,
            level: isValidLogLevel(config.logger?.level) ? config.logger?.level : isValidLogLevel(level) ? level : "error",
        })
    }
    if (debug || config?.logger === true || level) {
        return createLogger({
            level: isValidLogLevel(level) ? level : "debug",
            log: (options) => {
                const message = createSyslogMessage(options)
                console.log(message)
            },
        })
    }
    return undefined
}
