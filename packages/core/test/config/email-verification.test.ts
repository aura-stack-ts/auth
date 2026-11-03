import { getEmailVerificationConfig } from "@/config/get-email-verification.ts"
import { describe, test, expect } from "vitest"

describe("getEmailVerificationConfig", () => {
    test("should throw an error if expiresIn is not a positive integer", () => {
        expect(() => getEmailVerificationConfig({ emailVerification: { expiresIn: -1000 } })).toThrow(
            "The 'expiresIn' configuration value for email verification must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })

    test("should throw an error if expiresIn is not a number", () => {
        expect(() => getEmailVerificationConfig({ emailVerification: { expiresIn: Infinity } })).toThrow(
            "The 'expiresIn' configuration value for email verification must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })
})
