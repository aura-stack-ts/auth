import { describe, test, expect } from "vitest"
import { adapter, app, prismaClient } from "@test/stateful/app"
import { createHash } from "@aura-stack/auth/crypto"

describe("getSession (Stateful)", () => {
    describe("when a valid session exists", () => {
        test("returns session data when a valid session cookie is present", async () => {
            const user = await adapter.createUser({
                name: "John Doe",
                email: "john@example.com",
                image: "https://jhon.doe/avatar.png",
            })
            const tokenHash = await createHash("token-hash-123")
            const session = await adapter.createSession({
                id: "session-123",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })
            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: `aura-auth.session_token=token-hash-123`,
                    },
                })
            )
            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body).toEqual({
                success: true,
                session: {
                    user: {
                        sub: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    },
                    expires: session.expiresAt.toISOString(),
                },
            })
        })
    })

    describe("when no session exists", () => {
        test("returns 401 when no session cookie is present", async () => {
            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: { Cookie: "aura-auth.session_token=not-token" },
                })
            )
            expect(response.status).toBe(401)
            expect(await response.json()).toMatchObject({
                success: false,
                session: null,
            })
        })
    })

    describe("when the session expired", () => {
        test("returns 401 for expired session", async () => {
            const user = await adapter.createUser({
                name: "Expired Session User",
                email: "expired@example.com",
            })
            const sessionToken = "token-hash-expired"
            const tokenHash = await createHash(sessionToken)
            await adapter.createSession({
                id: "session-expired",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash,
                expiresAt: new Date(Date.now() - 1000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: `aura-auth.session_token=${sessionToken}`,
                    },
                })
            )

            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                success: false,
                session: null,
            })
        })

        test("returns 401 for revoked session", async () => {
            const user = await adapter.createUser({
                name: "Revoked Session User",
                email: "revoked@example.com",
            })
            const sessionToken = "token-hash-revoked"
            const tokenHash = await createHash(sessionToken)
            await adapter.createSession({
                id: "session-revoked",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
                status: "revoked",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: `aura-auth.session_token=${sessionToken}`,
                    },
                })
            )

            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                success: false,
                session: null,
            })
        })
    })

    describe("when the user is deleted", () => {
        test("returns 401 for session belonging to deleted user", async () => {
            const user = await adapter.createUser({
                name: "Deleted User",
                email: "deleteduser@example.com",
            })
            const sessionToken = "token-hash-deleted-user"
            const tokenHash = await createHash(sessionToken)
            await adapter.createSession({
                id: "session-deleted-user",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            await adapter.deleteUser(user.id)

            expect(await adapter.getSessionById("session-deleted-user")).toBeNull()
            expect(await adapter.getSessionByToken(sessionToken)).toBeNull()

            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: `aura-auth.session_token=${sessionToken}`,
                    },
                })
            )

            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                success: false,
                session: null,
            })
        })

        test("returns 401 for revoked session by admin", async () => {
            const user = await adapter.createUser({
                name: "Deleted User",
                email: "deleteduser@example.com",
            })
            const sessionToken = "token-hash-revoked-user"
            const tokenHash = await createHash(sessionToken)
            const session = await adapter.createSession({
                id: "session-deleted-user",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            await adapter.revokeSession(session.id, "admin_action")

            expect(await adapter.getSessionById("session-deleted-user")).toBeNull()
            expect(await adapter.getSessionByToken(sessionToken)).toBeNull()

            /**
             * When `deleteStrategy` is set to `soft`, the session is not deleted from the database
             * but is marked as revoked. This allows for auditing and tracking of session revocations without losing historical data.
             */
            expect(await prismaClient.session.findUnique({ where: { id: session.id } })).toHaveProperty("status", "REVOKED")

            const response = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: `aura-auth.session_token=${sessionToken}`,
                    },
                })
            )

            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                success: false,
                session: null,
            })
        })
    })

    describe("when multiple sessions exist for the same user", () => {
        test("handles multiple sessions for same user", async () => {
            const user = await adapter.createUser({
                name: "Multi Session User",
                email: "multisession@example.com",
            })

            const tokenHash1 = await createHash("token-hash-multi-1")
            const tokenHash2 = await createHash("token-hash-multi-2")
            await adapter.createSession({
                id: "session-multi-1",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: tokenHash1,
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            await adapter.createSession({
                id: "session-multi-2",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: tokenHash2,
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
                metadata: null,
            })

            const response1 = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: "aura-auth.session_token=token-hash-multi-1",
                    },
                })
            )

            const response2 = await app.handle(
                new Request("http://localhost:3000/api/auth/session", {
                    headers: {
                        Cookie: "aura-auth.session_token=token-hash-multi-2",
                    },
                })
            )

            expect(response1.status).toBe(200)
            expect(response2.status).toBe(200)

            expect(await response1.json()).toEqual({
                success: true,
                session: {
                    user: { sub: user.id, name: "Multi Session User", email: "multisession@example.com", image: null },
                    expires: expect.any(String),
                },
            })
            expect(await response2.json()).toEqual({
                success: true,
                session: {
                    user: { sub: user.id, name: "Multi Session User", email: "multisession@example.com", image: null },
                    expires: expect.any(String),
                },
            })
        })
    })
})
