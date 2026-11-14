import { describe, test, expect } from "vitest"

/**
 *
 * @param {import("@aura-stack/auth/types").DatabaseAdapter } adapter
 */
export const createAdapterSuite = (adapter) => {
    describe("Users", () => {
        test("createUser", async () => {
            const user = await adapter.createUser({
                name: "John Doe",
                email: "john@example.com",
                image: "https://example.com/john.jpg",
            })
            expect(user).toEqual({
                id: expect.any(String),
                name: "John Doe",
                email: "john@example.com",
                image: "https://example.com/john.jpg",
                emailVerifiedAt: null,
                status: "active",
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                deletedAt: null,
                attributes: null,
            })
        })

        test("getUserById", async () => {
            const created = await adapter.createUser({
                name: "Jane Doe",
                email: "jane@example.com",
            })
            const user = await adapter.getUserById(created.id)
            expect(user).toEqual(created)
        })

        test("getUserByEmail", async () => {
            const created = await adapter.createUser({
                name: "Bob Smith",
                email: "bob@example.com",
            })
            const user = await adapter.getUserByEmail("bob@example.com")
            expect(user).toEqual(created)
        })

        test("updateUser", async () => {
            const created = await adapter.createUser({
                name: "Alice Johnson",
                email: "alice@example.com",
            })
            const emailVerifiedAt = new Date()
            const updated = await adapter.updateUser(created.id, {
                name: "Alice Updated",
                emailVerifiedAt,
            })
            expect(updated).toEqual(
                expect.objectContaining({
                    id: created.id,
                    name: "Alice Updated",
                    email: "alice@example.com",
                    emailVerifiedAt,
                })
            )
        })

        test("deleteUser - soft delete", async () => {
            const created = await adapter.createUser({
                name: "Soft Delete User",
                email: "soft@example.com",
            })
            await adapter.deleteUser(created.id)
            const user = await adapter.getUserById(created.id)
            expect(user).toEqual(
                expect.objectContaining({
                    id: created.id,
                    name: "Soft Delete User",
                    email: "soft@example.com",
                    status: "deleted",
                })
            )
        })
    })

    describe("Accounts", () => {
        test("createAccount", async () => {
            const user = await adapter.createUser({
                name: "Account User",
                email: "account@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "google",
                providerUserId: "google-123",
                type: "oauth",
            })
            expect(account).toEqual({
                id: expect.any(String),
                userId: user.id,
                provider: "google",
                providerUserId: "google-123",
                type: "oauth",
                status: "active",
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                deletedAt: null,
            })
        })

        test("getAccountById", async () => {
            const user = await adapter.createUser({
                name: "Get Account User",
                email: "getaccount@example.com",
            })
            const created = await adapter.createAccount({
                userId: user.id,
                provider: "github",
                providerUserId: "github-456",
                type: "oauth",
            })
            const account = await adapter.getAccountById(created.id)
            expect(account).toEqual(created)
        })

        test("getAccountByProvider", async () => {
            const user = await adapter.createUser({
                name: "Provider User",
                email: "provider@example.com",
            })
            const created = await adapter.createAccount({
                userId: user.id,
                provider: "twitter",
                providerUserId: "twitter-789",
                type: "oauth",
            })
            const account = await adapter.getAccountByProvider("twitter", "twitter-789")
            expect(account).toEqual(created)
        })

        test("getAccountsByUserId", async () => {
            const user = await adapter.createUser({
                name: "Multiple Accounts User",
                email: "multiple@example.com",
            })
            await adapter.createAccount({
                userId: user.id,
                provider: "google",
                providerUserId: "google-1",
                type: "oauth",
            })
            await adapter.createAccount({
                userId: user.id,
                provider: "github",
                providerUserId: "github-1",
                type: "oauth",
            })
            await adapter.createAccount({
                userId: user.id,
                provider: "credentials",
                providerUserId: user.id,
                type: "credentials",
                status: "active",
            })

            const accounts = await adapter.getAccountsByUserId(user.id)
            expect(accounts).toHaveLength(3)
            expect(accounts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        userId: user.id,
                        provider: "google",
                        providerUserId: "google-1",
                        type: "oauth",
                    }),
                    expect.objectContaining({
                        userId: user.id,
                        provider: "github",
                        providerUserId: "github-1",
                        type: "oauth",
                    }),
                    expect.objectContaining({
                        userId: user.id,
                        provider: "credentials",
                        providerUserId: user.id,
                        status: "active",
                    }),
                ])
            )
        })

        test("updateAccountStatus", async () => {
            const user = await adapter.createUser({
                name: "Status User",
                email: "status@example.com",
            })
            const created = await adapter.createAccount({
                userId: user.id,
                provider: "linkedin",
                providerUserId: "linkedin-123",
                type: "oauth",
            })
            const updated = await adapter.updateAccountStatus(created.id, "suspended")
            expect(updated).toEqual(
                expect.objectContaining({
                    userId: user.id,
                    provider: "linkedin",
                    providerUserId: "linkedin-123",
                    type: "oauth",
                    status: "suspended",
                })
            )
        })

        test("unlinkAccount", async () => {
            const user = await adapter.createUser({
                name: "Unlink User",
                email: "unlink@example.com",
            })
            const created = await adapter.createAccount({
                userId: user.id,
                provider: "facebook",
                providerUserId: "facebook-123",
                type: "oauth",
            })
            await adapter.unlinkAccount(created.id)
            const account = await adapter.getAccountById(created.id)
            expect(account).toEqual(
                expect.objectContaining({
                    userId: user.id,
                    provider: "facebook",
                    providerUserId: "facebook-123",
                    type: "oauth",
                    status: "unlinked",
                })
            )
        })
    })

    describe("OAuth Accounts", () => {
        test("createOAuthAccount", async () => {
            const user = await adapter.createUser({
                name: "OAuth User",
                email: "oauth@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "google",
                providerUserId: "google-oauth",
                type: "oauth",
            })
            const oauthAccount = await adapter.createOAuthAccount({
                accountId: account.id,
                accessToken: "access-token-123",
                refreshToken: "refresh-token-456",
                tokenType: "Bearer",
                scopes: "profile email",
                issuer: "https://accounts.google.com",
            })
            expect(oauthAccount).toEqual({
                accountId: account.id,
                accessToken: "access-token-123",
                refreshToken: "refresh-token-456",
                idToken: null,
                tokenType: "Bearer",
                scopes: "profile email",
                issuer: "https://accounts.google.com",
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                updatedAt: expect.any(Date),
            })
        })

        test("getOAuthAccount", async () => {
            const user = await adapter.createUser({
                name: "Get OAuth User",
                email: "getoauth@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "github",
                providerUserId: "github-oauth",
                type: "oauth",
            })
            const created = await adapter.createOAuthAccount({
                accountId: account.id,
                accessToken: "github-access",
            })
            const oauthAccount = await adapter.getOAuthAccount(account.id)
            expect(oauthAccount).toEqual(created)
        })

        test("updateOAuthTokens", async () => {
            const user = await adapter.createUser({
                name: "Update Tokens User",
                email: "updatetokens@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "spotify",
                providerUserId: "spotify-oauth",
                type: "oauth",
            })
            await adapter.createOAuthAccount({
                accountId: account.id,
                accessToken: "old-access",
            })
            const updated = await adapter.updateOAuthTokens(account.id, {
                accessToken: "new-access",
                refreshToken: "new-refresh",
            })
            expect(updated).toEqual(
                expect.objectContaining({
                    accessToken: "new-access",
                    refreshToken: "new-refresh",
                })
            )
        })
    })

    describe("Credential Accounts", () => {
        test("createCredentialAccount", async () => {
            const user = await adapter.createUser({
                name: "Credential User",
                email: "credential@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "credentials",
                providerUserId: user.email,
                type: "credentials",
            })
            const credentialAccount = await adapter.createCredentialAccount({
                accountId: account.id,
                passwordHash: "hashed-password-123",
            })
            expect(credentialAccount).toEqual({
                accountId: account.id,
                passwordHash: "hashed-password-123",
                updatedAt: expect.any(Date),
            })
        })

        test("getCredentialAccount", async () => {
            const user = await adapter.createUser({
                name: "Get Credential User",
                email: "getcredential@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "credentials",
                providerUserId: user.email,
                type: "credentials",
            })
            const created = await adapter.createCredentialAccount({
                accountId: account.id,
                passwordHash: "hashed-password",
            })
            const credentialAccount = await adapter.getCredentialAccount(account.id)
            expect(credentialAccount).toEqual(created)
        })

        test("updatePasswordHash", async () => {
            const user = await adapter.createUser({
                name: "Update Password User",
                email: "updatepassword@example.com",
            })
            const account = await adapter.createAccount({
                userId: user.id,
                provider: "credentials",
                providerUserId: user.email,
                type: "credentials",
            })
            await adapter.createCredentialAccount({
                accountId: account.id,
                passwordHash: "old-hash",
            })
            const updated = await adapter.updatePasswordHash(account.id, "new-hash")
            expect(updated).toEqual(
                expect.objectContaining({
                    accountId: account.id,
                    passwordHash: "new-hash",
                    updatedAt: expect.any(Date),
                })
            )
        })
    })

    describe("Sessions", () => {
        test("createSession", async () => {
            const user = await adapter.createUser({
                name: "Session User",
                email: "session@example.com",
            })
            const session = await adapter.createSession({
                id: "session-123",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash-123",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            expect(session).toEqual({
                id: expect.any(String),
                userId: user.id,
                deviceId: null,
                authenticatedWith: "credentials",
                status: "active",
                mfaState: "none",
                tokenHash: "token-hash-123",
                expiresAt: expect.any(Date),
                lastActivityAt: expect.any(Date),
                revokedAt: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            })
        })

        test("getSessionById", async () => {
            const user = await adapter.createUser({
                name: "Get Session User",
                email: "getsession@example.com",
            })
            const created = await adapter.createSession({
                id: "session-456",
                userId: user.id,
                authenticatedWith: "oauth",
                tokenHash: "token-hash-456",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const session = await adapter.getSessionById(created.id)
            expect(session).toEqual(created)
        })

        test("listSessions", async () => {
            const user = await adapter.createUser({
                name: "List Sessions User",
                email: "listsessions@example.com",
            })
            await adapter.createSession({
                id: "session-1",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-1",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            await adapter.createSession({
                id: "session-2",
                userId: user.id,
                authenticatedWith: "oauth",
                tokenHash: "token-2",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const sessions = await adapter.listSessions({ userId: user.id, status: "active", deviceId: null })
            expect(sessions).toHaveLength(2)
        })

        test("listSessions with filters", async () => {
            const user = await adapter.createUser({
                name: "Filter Sessions User",
                email: "filtersessions@example.com",
            })
            await adapter.createSession({
                id: "session-filter-1",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-1",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const activeSessions = await adapter.listSessions({ userId: user.id, status: "active", deviceId: null })
            expect(activeSessions).toHaveLength(1)
        })

        test("updateSession", async () => {
            const user = await adapter.createUser({
                name: "Update Session User",
                email: "updatesession@example.com",
            })
            const created = await adapter.createSession({
                id: "session-update",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const lastActivityAt = new Date()
            const updated = await adapter.updateSession(created.id, {
                id: created.id,
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash-updated",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "completed",
                lastActivityAt,
            })
            expect(updated).toEqual(
                expect.objectContaining({
                    mfaState: "completed",
                    tokenHash: "token-hash-updated",
                    lastActivityAt,
                })
            )
        })

        test("touchSession", async () => {
            const user = await adapter.createUser({
                name: "Touch Session User",
                email: "touchsession@example.com",
            })
            const created = await adapter.createSession({
                id: "session-touch",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const newActivityTime = new Date()
            await adapter.touchSession(created.id, newActivityTime)
            const session = await adapter.getSessionById(created.id)
            expect(session).toEqual(
                expect.objectContaining({
                    lastActivityAt: newActivityTime,
                })
            )
        })

        test("revokeSession", async () => {
            const user = await adapter.createUser({
                name: "Revoke Session User",
                email: "revokesession@example.com",
            })
            const created = await adapter.createSession({
                id: "session-revoke",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            await adapter.revokeSession(created.id, "user_logout")
            expect(await adapter.getSessionById(created.id)).toBeNull()
        })

        test("revokeAllSessions", async () => {
            const user = await adapter.createUser({
                name: "Revoke All User",
                email: "revokeall@example.com",
            })
            const session1 = await adapter.createSession({
                id: "session-revoke-1",
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-1",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const session2 = await adapter.createSession({
                id: "session-revoke-2",
                userId: user.id,
                authenticatedWith: "oauth",
                tokenHash: "token-2",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "none",
                deviceId: null,
            })
            const count = await adapter.revokeAllSessions(user.id, "password_changed")
            expect(count).toBe(2)
            expect(await adapter.getSessionById(session1.id)).toBeNull()
            expect(await adapter.getSessionById(session2.id)).toBeNull()
        })
    })

    describe("Devices", () => {
        test("createDevice", async () => {
            const user = await adapter.createUser({
                name: "Device User",
                email: "device@example.com",
            })
            const device = await adapter.createDevice({
                id: "device-123",
                userId: user.id,
                name: "My MacBook",
                type: "desktop",
                platform: "macOS 14",
                browser: "Chrome 120",
                userAgent: "Mozilla/5.0...",
                fingerprint: "fp-123",
                lastIp: "192.168.1.1",
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            expect(device).toEqual({
                id: expect.any(String),
                userId: user.id,
                name: "My MacBook",
                type: "desktop",
                platform: "macOS 14",
                browser: "Chrome 120",
                userAgent: "Mozilla/5.0...",
                fingerprint: "fp-123",
                lastIp: "192.168.1.1",
                trusted: false,
                deletedAt: null,
                firstSeenAt: expect.any(Date),
                lastSeenAt: expect.any(Date),
            })
        })

        test("getDeviceById", async () => {
            const user = await adapter.createUser({
                name: "Get Device User",
                email: "getdevice@example.com",
            })
            const created = await adapter.createDevice({
                id: "device-456",
                userId: user.id,
                name: "iPhone",
                type: "mobile",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            const device = await adapter.getDeviceById(created.id)
            expect(device).toEqual(created)
        })

        test("getDeviceByFingerprint", async () => {
            const user = await adapter.createUser({
                name: "Fingerprint User",
                email: "fingerprint@example.com",
            })
            const created = await adapter.createDevice({
                id: "device-fp",
                userId: user.id,
                fingerprint: "fp-unique-123",
                name: null,
                type: "unknown",
                platform: null,
                browser: null,
                userAgent: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            const device = await adapter.getDeviceByFingerprint(user.id, "fp-unique-123")
            expect(device).toEqual(created)
        })

        test("getDevicesByUserId", async () => {
            const user = await adapter.createUser({
                name: "Multiple Devices User",
                email: "multidevices@example.com",
            })
            await adapter.createDevice({
                id: "device-1",
                userId: user.id,
                name: "Desktop",
                type: "desktop",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            await adapter.createDevice({
                id: "device-2",
                userId: user.id,
                name: "Mobile",
                type: "mobile",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            const devices = await adapter.getDevicesByUserId(user.id)
            expect(devices).toHaveLength(2)
        })

        test("updateDevice", async () => {
            const user = await adapter.createUser({
                name: "Update Device User",
                email: "updatedevice@example.com",
            })
            const created = await adapter.createDevice({
                id: "device-update",
                userId: user.id,
                name: "Old Name",
                type: "desktop",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            const updated = await adapter.updateDevice(created.id, {
                id: created.id,
                userId: user.id,
                name: "New Name",
                type: "desktop",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: true,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            expect(updated).toEqual(
                expect.objectContaining({
                    name: "New Name",
                    trusted: true,
                })
            )
        })

        test("trustDevice", async () => {
            const user = await adapter.createUser({
                name: "Trust Device User",
                email: "trustdevice@example.com",
            })
            const created = await adapter.createDevice({
                id: "device-trust",
                userId: user.id,
                name: "Work Laptop",
                type: "desktop",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            const trusted = await adapter.trustDevice(created.id, true)
            expect(trusted).toEqual(
                expect.objectContaining({
                    id: "device-trust",
                    name: "Work Laptop",
                    type: "desktop",
                    trusted: true,
                })
            )
        })

        test("deleteDevice", async () => {
            const user = await adapter.createUser({
                name: "Delete Device User",
                email: "deletedevice@example.com",
            })
            const created = await adapter.createDevice({
                id: "device-delete",
                userId: user.id,
                name: "To Delete",
                type: "desktop",
                platform: null,
                browser: null,
                userAgent: null,
                fingerprint: null,
                lastIp: null,
                trusted: false,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
            })
            await adapter.deleteDevice(created.id)
            const device = await adapter.getDeviceById(created.id)
            expect(device).toBeNull()
        })
    })

    describe("MFA Credentials", () => {
        test("createMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "MFA User",
                email: "mfa@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            expect(credential).toEqual({
                id: expect.any(String),
                userId: user.id,
                type: "totp",
                status: "active",
                isPrimary: true,
                verifiedAt: null,
                deletedAt: null,
                enrolledAt: expect.any(Date),
                createdAt: expect.any(Date),
            })
        })

        test("getMfaCredentialById", async () => {
            const user = await adapter.createUser({
                name: "Get MFA User",
                email: "getmfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: false,
                createdAt: new Date(),
            })
            const credential = await adapter.getMfaCredentialById(created.id)
            expect(credential).toEqual(created)
        })

        test("getMfaCredentialsByUserId", async () => {
            const user = await adapter.createUser({
                name: "Multiple MFA User",
                email: "multimfa@example.com",
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: false,
                createdAt: new Date(),
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "email",
                isPrimary: false,
                createdAt: new Date(),
            })
            const credentials = await adapter.getMfaCredentialsByUserId(user.id)
            expect(credentials).toHaveLength(2)
        })

        test("getMfaCredentialsByType", async () => {
            const user = await adapter.createUser({
                name: "Type MFA User",
                email: "typemfa@example.com",
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: false,
                createdAt: new Date(),
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "email",
                isPrimary: false,
                createdAt: new Date(),
            })
            const totpCredentials = await adapter.getMfaCredentialsByType(user.id, "totp")
            expect(totpCredentials).toHaveLength(1)
            expect(totpCredentials).toEqual(expect.arrayContaining([expect.objectContaining({ type: "totp", isPrimary: false })]))
        })

        test("verifyMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Verify MFA User",
                email: "verifymfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: false,
                createdAt: new Date(),
            })
            const verified = await adapter.verifyMfaCredential(created.id)
            expect(verified).toEqual(
                expect.objectContaining({
                    userId: user.id,
                    type: "totp",
                    status: "active",
                    verifiedAt: expect.any(Date),
                })
            )
        })

        test("updateMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Update MFA User",
                email: "updatemfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                status: "active",
                isPrimary: false,
                createdAt: new Date(),
            })
            const enrolledAt = new Date()
            const updated = await adapter.updateMfaCredential(created.id, {
                status: "pending",
                enrolledAt,
                isPrimary: true,
            })
            expect(updated).toEqual(
                expect.objectContaining({
                    enrolledAt,
                    isPrimary: true,
                    status: "pending",
                })
            )
        })

        test("deleteMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: false,
                createdAt: new Date(),
            })
            await adapter.deleteMfaCredential(created.id)
            const credential = await adapter.getMfaCredentialById(created.id)
            expect(credential).toBeNull()
        })

        test("createTotpCredential & getTotpCredentialByCredentialId", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const mfaCredential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                status: "active",
                createdAt: new Date(),
            })

            const verifiedAt = new Date()
            const created = await adapter.createTotpCredential({
                verifiedAt,
                credentialId: mfaCredential.id,
                secretCipher: "secret-cipher",
            })
            expect(created).toEqual({
                id: expect.any(String),
                verifiedAt,
                credentialId: mfaCredential.id,
                secretCipher: "secret-cipher",
            })

            const getTotp = await adapter.getTotpCredentialByCredentialId(mfaCredential.id)
            expect(getTotp).toEqual({
                id: created.id,
                verifiedAt,
                credentialId: mfaCredential.id,
                secretCipher: "secret-cipher",
            })
        })

        test("createSmsCredential & getSmsCredentialByCredentialId", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const mfaCredential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                status: "active",
                createdAt: new Date(),
            })

            const verifiedAt = new Date()
            const created = await adapter.createSmsCredential({
                verifiedAt,
                phoneNumber: "12345678",
                credentialId: mfaCredential.id,
            })
            expect(created).toEqual({
                id: expect.any(String),
                verifiedAt,
                phoneNumber: "12345678",
                credentialId: mfaCredential.id,
            })

            const getSMS = await adapter.getSmsCredentialByCredentialId(mfaCredential.id)
            expect(getSMS).toEqual({
                id: created.id,
                verifiedAt,
                phoneNumber: "12345678",
                credentialId: mfaCredential.id,
            })
        })

        test("createPushCredential & getPushCredentialByCredentialId", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const mfaCredential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                status: "active",
                createdAt: new Date(),
            })

            const verifiedAt = new Date()
            const created = await adapter.createPushCredential({
                verifiedAt,
                credentialId: mfaCredential.id,
                deviceToken: "device-token",
                platform: "platform-1",
            })
            expect(created).toEqual({
                id: expect.any(String),
                verifiedAt,
                credentialId: mfaCredential.id,
                deviceToken: "device-token",
                platform: "platform-1",
            })

            const getSMS = await adapter.getPushCredentialByCredentialId(mfaCredential.id)
            expect(getSMS).toEqual({
                id: created.id,
                verifiedAt,
                credentialId: mfaCredential.id,
                deviceToken: "device-token",
                platform: "platform-1",
            })
        })

        test("createBackupCodes & verifyBackupCode", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const mfaCredential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                status: "active",
                createdAt: new Date(),
            })

            const created = await adapter.createBackupCodes(mfaCredential.id, [
                {
                    codeHash: "code-hash-1",
                },
            ])
            expect(created).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        used: false,
                        usedAt: null,
                        codeHash: "code-hash-1",
                    }),
                ])
            )

            const verified = await adapter.verifyBackupCode(mfaCredential.id)
            expect(verified).toBe(true)
        })
    })

    describe("MFA Challenges", () => {
        test("createChallenge", async () => {
            const user = await adapter.createUser({
                name: "MFA Challenge User",
                email: "mfachallenge@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            const expiresAt = new Date(Date.now() + 300000)
            const challenge = await adapter.createChallenge({
                userId: user.id,
                sessionId: null,
                credentialId: credential.id,
                type: "totp",
                status: "pending",
                attemptCount: 0,
                expiresAt,
            })

            expect(challenge).toEqual({
                id: expect.any(String),
                userId: user.id,
                sessionId: "",
                credentialId: credential.id,
                type: "totp",
                status: "pending",
                attemptCount: 0,
                expiresAt,
                createdAt: expect.any(Date),
                verifiedAt: null,
            })
        })

        test("getChallengeById", async () => {
            const user = await adapter.createUser({
                name: "Get MFA Challenge User",
                email: "getmfachallenge@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            const created = await adapter.createChallenge({
                userId: user.id,
                sessionId: null,
                credentialId: credential.id,
                type: "totp",
                status: "pending",
                attemptCount: 0,
                expiresAt: new Date(Date.now() + 300000),
            })

            expect(await adapter.getChallengeById(created.id)).toEqual(created)
            expect(await adapter.getChallengeById("missing-challenge")).toBeNull()
        })

        test("incrementAttemptCount", async () => {
            const user = await adapter.createUser({
                name: "Increment MFA Challenge User",
                email: "incrementmfachallenge@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            const created = await adapter.createChallenge({
                userId: user.id,
                sessionId: null,
                credentialId: credential.id,
                type: "totp",
                status: "pending",
                attemptCount: 0,
                expiresAt: new Date(Date.now() + 300000),
            })

            const updated = await adapter.incrementAttemptCount(created.id)
            expect(updated).toEqual(
                expect.objectContaining({
                    id: created.id,
                    attemptCount: 1,
                    status: "pending",
                    verifiedAt: null,
                })
            )
        })

        test("verifyChallenge", async () => {
            const user = await adapter.createUser({
                name: "Verify MFA Challenge User",
                email: "verifymfachallenge@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            const created = await adapter.createChallenge({
                userId: user.id,
                sessionId: null,
                credentialId: credential.id,
                type: "totp",
                status: "pending",
                attemptCount: 0,
                expiresAt: new Date(Date.now() + 300000),
            })

            const verified = await adapter.verifyChallenge(created.id)
            expect(verified).toEqual(
                expect.objectContaining({
                    id: created.id,
                    status: "verified",
                    verifiedAt: expect.any(Date),
                })
            )
        })

        test("expireChallenges", async () => {
            const user = await adapter.createUser({
                name: "Expire MFA Challenge User",
                email: "expiremfachallenge@example.com",
            })
            const credential = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                isPrimary: true,
                createdAt: new Date(),
            })
            const session = await adapter.createSession({
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "expire-mfa-challenge-session",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "pending",
                deviceId: null,
            })
            const expiresAt = new Date(Date.now() + 300000)
            const createChallenge = (sessionId, status = "pending") =>
                adapter.createChallenge({
                    userId: user.id,
                    sessionId,
                    credentialId: credential.id,
                    type: "totp",
                    status,
                    attemptCount: 0,
                    expiresAt,
                })
            const pending = await createChallenge(session.id)
            const verified = await createChallenge(session.id)
            const otherSession = await adapter.createSession({
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "other-mfa-challenge-session",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "pending",
                deviceId: null,
            })
            const unaffected = await createChallenge(otherSession.id)
            await adapter.verifyChallenge(verified.id)

            await adapter.expireChallenges(session.id)

            expect(await adapter.getChallengeById(pending.id)).toEqual(expect.objectContaining({ status: "expired" }))
            expect(await adapter.getChallengeById(verified.id)).toEqual(expect.objectContaining({ status: "verified" }))
            expect(await adapter.getChallengeById(unaffected.id)).toEqual(expect.objectContaining({ status: "pending" }))
        })
    })

    describe("Verification Tokens", () => {
        test("createToken", async () => {
            const user = await adapter.createUser({
                name: "Verification Token User",
                email: "verificationtoken@example.com",
            })
            const expiresAt = new Date(Date.now() + 300000)
            const token = await adapter.createToken({
                userId: user.id,
                tokenHash: "verification-token-hash",
                type: "email_verification",
                identifier: null,
                newIdentifier: null,
                expiresAt,
            })

            expect(token).toEqual({
                id: expect.any(String),
                userId: user.id,
                tokenHash: "verification-token-hash",
                type: "email_verification",
                identifier: "",
                newIdentifier: null,
                expiresAt,
                revokedAt: null,
                createdAt: expect.any(Date),
            })
        })

        test("getTokenByHash", async () => {
            const user = await adapter.createUser({
                name: "Get Verification Token User",
                email: "getverificationtoken@example.com",
            })
            const created = await adapter.createToken({
                userId: user.id,
                tokenHash: "get-verification-token-hash",
                type: "password_reset",
                identifier: "getverificationtoken@example.com",
                newIdentifier: null,
                expiresAt: new Date(Date.now() + 300000),
            })

            expect(await adapter.getTokenByHash(created.tokenHash)).toEqual(created)
            expect(await adapter.getTokenByHash("missing-token-hash")).toBeNull()
        })

        test("getTokensByUserId", async () => {
            const user = await adapter.createUser({
                name: "List Verification Tokens User",
                email: "listverificationtokens@example.com",
            })
            const otherUser = await adapter.createUser({
                name: "Other Verification Token User",
                email: "otherverificationtoken@example.com",
            })
            const expiresAt = new Date(Date.now() + 300000)
            const first = await adapter.createToken({
                userId: user.id,
                tokenHash: "first-verification-token-hash",
                type: "email_verification",
                identifier: "listverificationtokens@example.com",
                newIdentifier: null,
                expiresAt,
            })
            const second = await adapter.createToken({
                userId: user.id,
                tokenHash: "second-verification-token-hash",
                type: "magic_link",
                identifier: null,
                newIdentifier: null,
                expiresAt,
            })
            await adapter.createToken({
                userId: otherUser.id,
                tokenHash: "other-verification-token-hash",
                type: "email_verification",
                identifier: "otherverificationtoken@example.com",
                newIdentifier: null,
                expiresAt,
            })

            expect(await adapter.getTokensByUserId(user.id)).toEqual(expect.arrayContaining([first, second]))
            expect(await adapter.getTokensByUserId(user.id)).toHaveLength(2)
        })

        test("revokeToken", async () => {
            const user = await adapter.createUser({
                name: "Revoke Verification Token User",
                email: "revokeverificationtoken@example.com",
            })
            const created = await adapter.createToken({
                userId: user.id,
                tokenHash: "revoke-verification-token-hash",
                type: "password_reset",
                identifier: "revokeverificationtoken@example.com",
                newIdentifier: null,
                expiresAt: new Date(Date.now() + 300000),
            })

            expect(await adapter.revokeToken(created.id)).toBe(true)
            expect(await adapter.revokeToken(created.id)).toBe(false)
            expect(await adapter.getTokenByHash(created.tokenHash)).toEqual(
                expect.objectContaining({
                    id: created.id,
                    revokedAt: expect.any(Date),
                })
            )
        })

        test("revokeAllVerificationTokens", async () => {
            const user = await adapter.createUser({
                name: "Revoke All Verification Tokens User",
                email: "revokeallverificationtokens@example.com",
            })
            const expiresAt = new Date(Date.now() + 300000)
            const matchingTokens = await Promise.all(
                ["password-reset-token-1", "password-reset-token-2"].map((tokenHash) =>
                    adapter.createToken({
                        userId: user.id,
                        tokenHash,
                        type: "password_reset",
                        identifier: "revokeallverificationtokens@example.com",
                        newIdentifier: null,
                        expiresAt,
                    })
                )
            )
            const otherType = await adapter.createToken({
                userId: user.id,
                tokenHash: "email-verification-token",
                type: "email_verification",
                identifier: "revokeallverificationtokens@example.com",
                newIdentifier: null,
                expiresAt,
            })

            expect(await adapter.revokeAllVerificationTokens(user.id, "password_reset")).toBe(2)
            const tokens = await adapter.getTokensByUserId(user.id)
            expect(tokens).toEqual(
                expect.arrayContaining([
                    ...matchingTokens.map((token) => expect.objectContaining({ id: token.id, revokedAt: expect.any(Date) })),
                    expect.objectContaining({ id: otherType.id, revokedAt: null }),
                ])
            )
        })
    })

    describe("OAuth Transactions", () => {
        test("createOAuthTransaction", async () => {
            const transaction = await adapter.createOAuthTransaction({
                id: "transaction-123",
                provider: "google",
                state: "state-123",
                redirectURI: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
            })
            expect(transaction).toEqual({
                id: expect.any(String),
                provider: "google",
                state: "state-123",
                nonce: null,
                codeVerifier: null,
                redirectURI: "https://example.com/callback",
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: expect.any(Date),
                expiresAt: expect.any(Date),
            })
        })

        test("getOAuthTransactionByState", async () => {
            const created = await adapter.createOAuthTransaction({
                id: "transaction-456",
                provider: "github",
                state: "state-456",
                redirectURI: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
            })
            const transaction = await adapter.getOAuthTransactionByState("state-456")
            expect(transaction).toEqual(created)
        })

        test("consumeOAuthTransaction", async () => {
            const created = await adapter.createOAuthTransaction({
                id: "transaction-789",
                provider: "twitter",
                state: "state-789",
                redirectURI: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
            })
            const consumed = await adapter.consumeOAuthTransaction("state-789")
            expect(consumed).toEqual(created)
            const after = await adapter.getOAuthTransactionByState("state-789")
            expect(after).toBeNull()
        })

        test("deleteExpiredOAuthTransactions", async () => {
            await adapter.createOAuthTransaction({
                id: "transaction-expired",
                provider: "test",
                state: "expired-state",
                redirectURI: "https://example.com/callback",
                expiresAt: new Date(Date.now() - 1000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
            })
            await adapter.createOAuthTransaction({
                id: "transaction-valid",
                provider: "test",
                state: "valid-state",
                redirectURI: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
            })
            const count = await adapter.deleteExpiredOAuthTransactions()
            expect(count).toBe(1)
        })
    })
}
