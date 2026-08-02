import { describe, test, expect } from "vitest"
import { adapter, app, auth } from "@test/stateful/app"
import { createCSRF, createHash } from "@aura-stack/auth/crypto"

describe("updateSession (Stateful)", () => {
    test("returns 400 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
            redirect: false,
            redirectURL: null,
        })
    })

    test("returns 400 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid-token; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
            redirect: false,
            redirectURL: null,
        })
    })

    test("updates session data when valid session is present", async () => {
        const user = await adapter.createUser({
            name: "Update Session User",
            email: "updatesession@example.com",
        })
        const tokenHash = await createHash("token-hash-update")
        await adapter.createSession({
            id: "session-update-123",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-update; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    user: {
                        name: "Updated Name",
                    },
                }),
            })
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            session: {
                user: {
                    sub: user.id,
                    name: "Updated Name",
                    email: user.email,
                    image: user.image,
                },
                expires: expect.any(String),
            },
            redirect: false,
            redirectURL: null,
        })
    })

    test("fails with invalid CSRF token even with valid session", async () => {
        const user = await adapter.createUser({
            name: "CSRF Fail User",
            email: "csrf-fail@example.com",
        })
        await adapter.createSession({
            id: "session-csrf-fail",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-csrf",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": "invalid",
                    Cookie: `aura-auth.session_token=token-hash-csrf; aura-auth.csrf_token=invalid`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
            redirect: false,
            redirectURL: null,
        })
    })
})
