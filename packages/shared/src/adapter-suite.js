import { describe, test, expect } from "vitest"

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
                mfaEnabled: false,
                mfaPreferredMethod: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
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
            const updated = await adapter.updateUser(created.id, {
                name: "Alice Updated",
                emailVerifiedAt: new Date(),
                mfaEnabled: true,
                mfaPreferredMethod: "totp",
            })
            expect(updated.id).toBe(created.id)
            expect(updated.name).toBe("Alice Updated")
            expect(updated.emailVerifiedAt).not.toBeNull()
            expect(updated.mfaEnabled).toBe(true)
            expect(updated.mfaPreferredMethod).toBe("totp")
        })

        test("deleteUser - soft delete", async () => {
            const created = await adapter.createUser({
                name: "Soft Delete User",
                email: "soft@example.com",
            })
            await adapter.deleteUser(created.id)
            const user = await adapter.getUserById(created.id)
            expect(user?.status).toBe("deleted")
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
            const accounts = await adapter.getAccountsByUserId(user.id)
            expect(accounts).toHaveLength(2)
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
            expect(updated.status).toBe("suspended")
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
            expect(account?.status).toBe("unlinked")
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
            expect(updated.accessToken).toBe("new-access")
            expect(updated.refreshToken).toBe("new-refresh")
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
            expect(updated.passwordHash).toBe("new-hash")
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
            })
            const updated = await adapter.updateSession(created.id, {
                id: created.id,
                userId: user.id,
                authenticatedWith: "credentials",
                tokenHash: "token-hash",
                expiresAt: new Date(Date.now() + 3600000),
                status: "active",
                mfaState: "completed",
                deviceId: null,
                metadata: null,
            })
            expect(updated.mfaState).toBe("completed")
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
                metadata: null,
            })
            const newActivityTime = new Date()
            await adapter.touchSession(created.id, newActivityTime)
            const session = await adapter.getSessionById(created.id)
            expect(session?.lastActivityAt.getTime()).toBeGreaterThanOrEqual(newActivityTime.getTime())
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                firstSeenAt: expect.any(Date),
                lastSeenAt: expect.any(Date),
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
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
                metadata: null,
            })
            expect(updated.name).toBe("New Name")
            expect(updated.trusted).toBe(true)
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
                metadata: null,
            })
            const trusted = await adapter.trustDevice(created.id, true)
            expect(trusted.trusted).toBe(true)
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
                metadata: null,
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
                credentialData: { secret: "secret-123" },
                isPrimary: true,
                createdAt: new Date(),
                metadata: null,
            })
            expect(credential).toEqual({
                id: expect.any(String),
                userId: user.id,
                type: "totp",
                credentialData: { secret: "secret-123" },
                isPrimary: true,
                verifiedAt: null,
                createdAt: expect.any(Date),
                metadata: null,
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
                credentialData: { secret: "secret" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
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
                credentialData: { secret: "secret-1" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "email",
                credentialData: { email: "test@example.com" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
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
                credentialData: { secret: "secret" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            await adapter.createMfaCredential({
                userId: user.id,
                type: "email",
                credentialData: { email: "test@example.com" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            const totpCredentials = await adapter.getMfaCredentialsByType(user.id, "totp")
            expect(totpCredentials).toHaveLength(1)
            expect(totpCredentials[0].type).toBe("totp")
        })

        test("verifyMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Verify MFA User",
                email: "verifymfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                credentialData: { secret: "secret" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            const verified = await adapter.verifyMfaCredential(created.id)
            expect(verified.verifiedAt).not.toBeNull()
        })

        test("updateMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Update MFA User",
                email: "updatemfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                credentialData: { secret: "old-secret" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            const updated = await adapter.updateMfaCredential(created.id, {
                userId: user.id,
                type: "totp",
                credentialData: { secret: "new-secret" },
                isPrimary: true,
                createdAt: new Date(),
                metadata: null,
            })
            expect(updated.credentialData).toEqual({ secret: "new-secret" })
            expect(updated.isPrimary).toBe(true)
        })

        test("deleteMfaCredential", async () => {
            const user = await adapter.createUser({
                name: "Delete MFA User",
                email: "deletemfa@example.com",
            })
            const created = await adapter.createMfaCredential({
                userId: user.id,
                type: "totp",
                credentialData: { secret: "secret" },
                isPrimary: false,
                createdAt: new Date(),
                metadata: null,
            })
            await adapter.deleteMfaCredential(created.id)
            const credential = await adapter.getMfaCredentialById(created.id)
            expect(credential).toBeNull()
        })
    })

    describe("OAuth Transactions", () => {
        test("createOAuthTransaction", async () => {
            const transaction = await adapter.createOAuthTransaction({
                id: "transaction-123",
                provider: "google",
                state: "state-123",
                redirectUri: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
                metadata: null,
            })
            expect(transaction).toEqual({
                id: expect.any(String),
                provider: "google",
                state: "state-123",
                nonce: null,
                codeVerifier: null,
                redirectUri: "https://example.com/callback",
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: expect.any(Date),
                expiresAt: expect.any(Date),
                metadata: null,
            })
        })

        test("getOAuthTransactionByState", async () => {
            const created = await adapter.createOAuthTransaction({
                id: "transaction-456",
                provider: "github",
                state: "state-456",
                redirectUri: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
                metadata: null,
            })
            const transaction = await adapter.getOAuthTransactionByState("state-456")
            expect(transaction).toEqual(created)
        })

        test("consumeOAuthTransaction", async () => {
            const created = await adapter.createOAuthTransaction({
                id: "transaction-789",
                provider: "twitter",
                state: "state-789",
                redirectUri: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
                metadata: null,
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
                redirectUri: "https://example.com/callback",
                expiresAt: new Date(Date.now() - 1000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
                metadata: null,
            })
            await adapter.createOAuthTransaction({
                id: "transaction-valid",
                provider: "test",
                state: "valid-state",
                redirectUri: "https://example.com/callback",
                expiresAt: new Date(Date.now() + 300000),
                nonce: null,
                codeVerifier: null,
                redirectTo: null,
                userAgent: null,
                fingerprint: null,
                deviceId: null,
                createdAt: new Date(),
                metadata: null,
            })
            const count = await adapter.deleteExpiredOAuthTransactions()
            expect(count).toBe(1)
        })
    })
}
