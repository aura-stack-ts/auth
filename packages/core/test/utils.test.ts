import { describe, expect, test } from "vitest"
import { toCastCase, toSnakeCase } from "@/utils.js"
import { OAuthAuthorizationErrorResponse } from "@/schemas.js"

describe("toSnakeCase", () => {
    const testCases = [
        {
            description: "converts camelCase to snake_case",
            input: "camelCaseString",
            expected: "camel_case_string",
        },
        {
            description: "converts PascalCase to snake_case",
            input: "PascalCaseString",
            expected: "pascal_case_string",
        },
        {
            description: "handles acronyms correctly",
            input: "HTTPServerError",
            expected: "http_server_error",
        },
        {
            description: "handles leading underscores",
            input: "_LeadingUnderscore",
            expected: "leading_underscore",
        },
        {
            description: "handles mixed case with numbers",
            input: "version2UpdateAvailable",
            expected: "version2_update_available",
        },
        {
            description: "returns empty string when input is empty",
            input: "",
            expected: "",
        },
        {
            description: "handles redirectURI",
            input: "redirectURI",
            expected: "redirect_uri",
        },
    ]

    for (const { description, input, expected } of testCases) {
        test(description, () => {
            expect(toSnakeCase(input)).toBe(expected)
        })
    }
})

describe("toUpperCase", () => {
    test("converts string to uppercase", () => {
        const entries = toCastCase(OAuthAuthorizationErrorResponse.shape.error.enum, "upper")
        expect(entries).toEqual({
            INVALID_REQUEST: "invalid_request",
            UNAUTHORIZED_CLIENT: "unauthorized_client",
            ACCESS_DENIED: "access_denied",
            UNSUPPORTED_RESPONSE_TYPE: "unsupported_response_type",
            INVALID_SCOPE: "invalid_scope",
            SERVER_ERROR: "server_error",
            TEMPORARILY_UNAVAILABLE: "temporarily_unavailable",
        })
    })
})