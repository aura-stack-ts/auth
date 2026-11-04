import { getPasswordResetConfig } from "@/config/get-password-reset.ts"
import { describe, test, expect } from "vitest"

describe("getPasswordResetConfig", () => {
    test("should throw an error if expiresIn is not a positive integer", () => {
        expect(() => getPasswordResetConfig({ passwordReset: { expiresIn: -1000 } })).toThrow(
            "The 'expiresIn' configuration value for password reset must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })

    test("should throw an error if expiresIn is not a number", () => {
        expect(() => getPasswordResetConfig({ passwordReset: { expiresIn: Infinity } })).toThrow(
            "The 'expiresIn' configuration value for password reset must be a positive integer representing the number of seconds until expiration. The provided value does not meet this requirement."
        )
    })
})
