import { describe, test, expect } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { getBasePathConfig } from "@/config/get-base-path.ts"
import type { RoutePattern } from "@aura-stack/router"

describe("add custom basePath config", () => {
    describe("valid basePath config", () => {
        const testCases = [
            {
                description: "basePath with trailing slash",
                basePath: "/api/v1/auth/",
                expectedBasePath: "/api/v1/auth",
            },
            {
                description: "basePath without trailing slash",
                basePath: "/api/v1/auth",
                expectedBasePath: "/api/v1/auth",
            },
            {
                description: "basePath with multiple trailing slashes",
                basePath: "/api/v1/auth///",
                expectedBasePath: "/api/v1/auth",
            },
            {
                description: "basePath with multiple leading and trailing slashes",
                basePath: "///api/v1/auth///",
                expectedBasePath: "/api/v1/auth",
            },
        ]

        for (const { description, basePath, expectedBasePath } of testCases) {
            test(description, () => {
                expect(getBasePathConfig({ oauth: [], basePath: basePath as RoutePattern })).toBe(expectedBasePath)
            })
        }
    })

    describe("invalid basePath config", () => {
        const invalidTestCases = [
            {
                description: "basePath with no trailing slash and no leading slash",
                basePath: "api/v1/auth",
                expectedBasePath: "api/v1/auth",
            },
            {
                description: "basePath without leading slash and with trailing slash",
                basePath: "api/v1/auth/",
                expectedBasePath: "/api/v1/auth",
            },
        ]

        for (const { description, basePath } of invalidTestCases) {
            test(description, () => {
                expect(() => getBasePathConfig({ oauth: [], basePath: basePath as RoutePattern })).toThrow()
            })
        }
    })
})
