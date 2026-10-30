import { getMagicLinkConfig } from "@/config/get-magic-links.ts"
import { describe, test, expect } from "vitest"

describe("getMagicLinkConfig", () => {
    test("should throw an error if expiresIn is not a positive integer", () => {
        expect(() => getMagicLinkConfig({ magicLinks: { expiresIn: -1000 } })).toThrow(
            "The 'expiresIn' configuration value for magic links must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })

    test("should throw an error if expiresIn is not a number", () => {
        expect(() => getMagicLinkConfig({ magicLinks: { expiresIn: Infinity } })).toThrow(
            "The 'expiresIn' configuration value for magic links must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })
})
