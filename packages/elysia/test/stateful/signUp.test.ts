import { describe, test, expect } from "vitest"
import { adapter, app, auth } from "@test/stateful/app"
import { createCSRF } from "@aura-stack/auth/crypto"

describe("signUp (Stateful)", () => {
    test("returns 400 or fails when required fields are missing or email is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "", password: "short" }),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                email: {
                    code: "invalid_format",
                    message: "Invalid email address",
                },
                firstName: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
                lastName: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })

    test("returns 200/201 and creates a user and session cookie when valid payload is provided", async () => {
        const csrfToken = await createCSRF(auth.jose)
        const email = "newuser@example.com"

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email,
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        expect(response.headers.get("set-cookie")).toBeDefined()

        const createdUser = await adapter.getUserByEmail(email)
        expect(createdUser).toEqual({
            id: expect.any(String),
            name: "John Doe",
            email: `newuser@example.com`,
            image: `https://avatars.dicebear.com/api/identicon/JohnDoe.svg`,
            emailVerifiedAt: null,
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            attributes: {},
        })
    })

    test("fails with invalid CSRF token", async () => {
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": "invalid-csrf",
                    Cookie: `aura-auth.csrf_token=invalid-csrf`,
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email: "test@example.com",
                }),
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("fails with missing CSRF token", async () => {
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email: "test@example.com",
                }),
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })
})
