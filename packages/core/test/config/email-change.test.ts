import { describe, test, expect } from "vitest"
import { getEmailChangeConfig } from "@/config/get-email-change.ts"

describe("getEmailChangeConfig", () => {
    test("should throw an error if expiresIn is not a positive integer", () => {
        expect(() => getEmailChangeConfig({ emailChange: { expiresIn: -1000 } })).toThrow(
            "The 'expiresIn' configuration value for email change must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })

    test("should throw an error if expiresIn is not a number", () => {
        expect(() => getEmailChangeConfig({ emailChange: { expiresIn: Infinity } })).toThrow(
            "The 'expiresIn' configuration value for email change must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })
})
