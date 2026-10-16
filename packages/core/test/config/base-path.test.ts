import { describe, test, expect, vi } from "vitest"
import { getBasePathConfig } from "@/config/get-base-path.ts"
import type { RoutePattern } from "@aura-stack/router"

describe("add custom basePath config", () => {
    describe("valid basePath config", () => {
        const testCases = [
            {
                description: "basePath without trailing slash",
                basePath: "/api/v1/auth",
                expected: "/api/v1/auth",
            },
        ]

        for (const { description, basePath, expected } of testCases) {
            test(description, () => {
                expect(getBasePathConfig({ basePath: basePath as RoutePattern })).toBe(expected)
            })
        }
    })

    describe("invalid basePath config", () => {
        const invalidTestCases = [
            {
                description: "basePath with trailing slash",
                basePath: "/api/v1/auth/",
            },
            {
                description: "basePath with no trailing slash and no leading slash",
                basePath: "api/v1/auth",
            },
            {
                description: "basePath without leading slash and with trailing slash",
                basePath: "api/v1/auth/",
            },
            {
                description: "basePath with multiple trailing slashes",
                basePath: "/api/v1/auth///",
            },
            {
                description: "basePath with multiple leading and trailing slashes",
                basePath: "///api/v1/auth///",
            },
            {
                description: "basePath with only slashes",
                basePath: "/",
            },
        ]

        for (const { description, basePath } of invalidTestCases) {
            test.concurrent(description, () => {
                expect(() => getBasePathConfig({ basePath: basePath as RoutePattern })).toThrow(
                    expect.objectContaining({
                        code: "INVALID_BASE_PATH_CONFIG",
                    })
                )
            })
        }
    })

    describe("define basePath config with environment variable", () => {
        const testCases = [
            {
                description: "set basePath from BASE_PATH environment variable",
                basePath: "/api/v1/auth",
                expected: "/api/v1/auth",
            },
            {
                description: "set basePath from BASE_PATH environment variable with undefined value",
                basePath: undefined,
                expected: "/auth",
            },
            {
                description: "set basePath from BASE_PATH environment variable with empty string value",
                basePath: "",
                expected: "/auth",
            },
        ]

        for (const { description, basePath, expected } of testCases) {
            test(description, () => {
                vi.stubEnv("BASE_PATH", basePath)
                expect(getBasePathConfig({})).toBe(expected)
            })
        }
    })
})
