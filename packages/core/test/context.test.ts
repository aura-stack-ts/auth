import { describe, expect, vi, test } from "vitest"
import { createProxyLogger } from "@/lib/logger.ts"
import type { Logger } from "@/@types/index.ts"

describe("createProxyLogger", () => {
    test("proxyLogger with disabled logger", () => {
        const logger = createProxyLogger()
        expect(logger).toBeUndefined()
    })

    test("proxyLogger with enabled logger", () => {
        const logger = createProxyLogger({ oauth: [], logger: true })
        expect(logger).toMatchObject({ level: "debug", log: expect.any(Function) })
    })

    test("proxyLogger with enabled logger and DEBUG env var set to false", () => {
        vi.stubEnv("DEBUG", "false")
        const logger = createProxyLogger({ oauth: [], logger: true })
        expect(logger).toMatchObject({ level: "debug", log: expect.any(Function) })
    })

    test("proxyLogger with DEBUG env var set to true", () => {
        vi.stubEnv("DEBUG", "true")
        const logger = createProxyLogger()
        expect(logger).toMatchObject({ level: "debug", log: expect.any(Function) })
    })

    test("proxyLogger with LOG_LEVEL env var set to info", () => {
        vi.stubEnv("LOG_LEVEL", "info")
        const logger = createProxyLogger({ oauth: [], logger: true })
        expect(logger?.level).toBe("info")
    })

    test("proxyLogger with DEBUG and LOG_LEVEL env vars set", () => {
        vi.stubEnv("DEBUG", "true")
        vi.stubEnv("LOG_LEVEL", "error")
        const logger = createProxyLogger({ oauth: [], logger: true })
        expect(logger?.level).toBe("error")
    })

    test("proxyLogger with enabled logger and DEBUG and LOG_LEVEL env vars set", () => {
        vi.stubEnv("DEBUG", "true")
        vi.stubEnv("LOG_LEVEL", "error")
        const logger = createProxyLogger({ oauth: [], logger: { level: "warn", log: () => {} } })
        expect(logger?.level).toBe("warn")
    })

    test("proxyLogger should fallback to debug when LOG_LEVEL env var is invalid", () => {
        vi.stubEnv("LOG_LEVEL", "verbose")
        const logger = createProxyLogger({ oauth: [], logger: true })
        expect(logger?.level).toBe("debug")
    })

    test("proxyLogger with LOG_LEVEL env var and without logger enabled", () => {
        vi.stubEnv("LOG_LEVEL", "warn")
        const logger = createProxyLogger()
        expect(logger).toMatchObject({ level: "warn", log: expect.any(Function) })
    })

    test("proxyLogger with empty config", () => {
        const logger = createProxyLogger({ oauth: [], logger: {} })
        expect(logger?.level).toBe("error")
    })

    test("proxyLogger with custom logger", () => {
        const log = vi.fn()
        const customLogger: Logger = {
            level: "error",
            log,
        }
        const logger = createProxyLogger({ oauth: [], logger: customLogger })
        expect(logger).toMatchObject({ level: "error", log: expect.any(Function) })

        logger?.log("AUTH_SESSION_INVALID")
        expect(log).not.toHaveBeenCalled()

        const timestamp = new Date().toISOString()
        logger?.log("SERVER_ERROR", { timestamp })
        expect(log).toHaveBeenCalledWith(
            expect.objectContaining({
                msgId: "SERVER_ERROR",
                severity: "error",
                timestamp,
            })
        )
    })
})
