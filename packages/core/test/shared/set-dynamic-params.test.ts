import { describe, test, expect } from "vitest"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { setDynamicParams } from "@/shared/utils/params.ts"

describe("setDynamicParams", () => {
    describe("valid cases", () => {
        const testCases = [
            {
                description: "set without dynamic param",
                input: "https://app.com/issuer",
                values: {},
                expected: "https://app.com/issuer",
            },
            {
                description: "set one dynamic param",
                input: "https://app.com/issuer/:slug",
                values: { slug: 1 },
                expected: "https://app.com/issuer/1",
            },
            {
                description: "set two dynamic params",
                input: "https://app.com/issuer/:slug/apps/:appId",
                values: { slug: 1, appId: 2 },
                expected: "https://app.com/issuer/1/apps/2",
            },
            {
                description: "set two continue params",
                input: "https://app.com/issuer/:slug/:id",
                values: { slug: 1, id: 2 },
                expected: "https://app.com/issuer/1/2",
            },
            {
                description: "set dynamic param with host",
                input: "https://host:8443/realms/acme",
                values: {},
                expected: "https://host:8443/realms/acme",
            },
            {
                description: "set dynamic param with host and path",
                input: "https://host:8443/realms/:realm",
                values: { realm: "acme" },
                expected: "https://host:8443/realms/acme",
            },
        ]

        for (const { description, input, values, expected } of testCases) {
            test(description, () => {
                expect(setDynamicParams(input, values, "acme")).toBe(expected)
            })
        }
    })

    describe("invalid cases", () => {
        const testCases = [
            {
                description: "missing dynamic values",
                input: "https://app.com/issuer/:slug",
                values: {},
            },
        ]

        for (const { description, input, values } of testCases) {
            test(description, () => {
                expect(() => setDynamicParams(input, values, "acme")).toThrow(AuraAuthError)
            })
        }
    })
})
