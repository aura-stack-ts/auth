import { describe, test, expect } from "vitest"
import { getCredentialsConfig } from "@/config/get-credentials.ts"

describe("getCredentialsConfig", () => {
    test("should throw an error when hash is only provided", () => {
        expect(() =>
            getCredentialsConfig({
                credentials: {
                    hash: async () => "hash",
                    authorize: async () => null,
                },
            })
        ).toThrow(
            "The custom credentials hash or verify function provided in the configuration is invalid. The two functions must be provided together and must be valid functions."
        )
    })

    test("should throw an error when verify is only provided", () => {
        expect(() =>
            getCredentialsConfig({
                credentials: {
                    verify: async () => true,
                    authorize: async () => null,
                },
            })
        ).toThrow(
            "The custom credentials hash or verify function provided in the configuration is invalid. The two functions must be provided together and must be valid functions."
        )
    })

    test("should work when both hash and verify are provided", () => {
        const config = {
            hash: async () => "hash",
            verify: async () => true,
            authorize: async () => null,
        }
        expect(
            getCredentialsConfig({
                credentials: config,
            })
        ).toEqual(config)
    })
})
