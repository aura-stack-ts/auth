import { describe, test, expect, vi } from "vitest"
import { authInstance } from "@test/setup/auth.ts"
import { openIDMetadata } from "@test/setup/presets.ts"

describe("signIn API (stateful)", () => {
    test("throws error when provider is missing", async () => {
        const createOAuthTransactionMock = vi.fn()

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })
        const output = await api.signIn("unsupported", { headers: new Headers() })

        expect(output).toMatchObject({
            success: false,
            signInURL: null,
            redirect: false,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
            },
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("signIn with BASE_URL stores OAuth transaction in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const createOAuthTransactionMock = vi.fn().mockResolvedValue({
            id: "transaction-123",
            provider: "oauth-provider",
            state: "state-value",
            nonce: null,
            codeVerifier: "code-verifier",
            redirectURI: "https://example.com/auth/callback/oauth-provider",
            redirectTo: null,
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        })

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })

        const output = await api.signIn("oauth-provider")
        expect(output).toEqual({
            success: true,
            redirect: true,
            signInURL: expect.any(String),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(output.headers).toHaveValidSetCookies([])

        const response = output.toResponse()
        expect(response.status).toBe(302)

        expect(createOAuthTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: "oauth-provider",
                redirectURI: "https://example.com/auth/callback/oauth-provider",
                state: expect.any(String),
                codeVerifier: expect.any(String),
            })
        )
    })

    test("signIn with baseURL in context stores OAuth transaction in database", async () => {
        const createOAuthTransactionMock = vi.fn().mockResolvedValue({
            id: "transaction-123",
            provider: "oauth-provider",
            state: "state-value",
            nonce: null,
            codeVerifier: "code-verifier",
            redirectURI: "https://example.com/auth/callback/oauth-provider",
            redirectTo: null,
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        })

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })

        const output = await api.signIn("oauth-provider", {
            request: new Request("https://example.com/auth/signIn/oauth-provider"),
        })
        expect(output).toEqual({
            success: true,
            redirect: true,
            signInURL: expect.any(String),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(output.headers).toHaveValidSetCookies([])

        const response = output.toResponse()
        expect(response.status).toBe(302)
        expect(createOAuthTransactionMock).toHaveBeenCalled()
    })

    test("signIn with disabled redirect stores OAuth transaction in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const createOAuthTransactionMock = vi.fn().mockResolvedValue({
            id: "transaction-123",
            provider: "oauth-provider",
            state: "state-value",
            nonce: null,
            codeVerifier: "code-verifier",
            redirectURI: "https://example.com/auth/callback/oauth-provider",
            redirectTo: null,
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        })

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })

        const output = await api.signIn("oauth-provider", {
            redirect: false,
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            signInURL: expect.any(String),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSetCookies([])

        expect(createOAuthTransactionMock).not.toHaveBeenCalled()
    })

    test("signIn with valid redirectTo stores in OAuth transaction", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const createOAuthTransactionMock = vi.fn().mockResolvedValue({
            id: "transaction-123",
            provider: "oauth-provider",
            state: "state-value",
            nonce: null,
            codeVerifier: "code-verifier",
            redirectURI: "https://example.com/auth/callback/oauth-provider",
            redirectTo: "/dashboard",
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        })

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })

        const output = await api.signIn("oauth-provider", { redirectTo: "/dashboard" })
        expect(output).toEqual({
            success: true,
            redirect: true,
            signInURL: expect.any(String),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(output.headers).toHaveValidSetCookies([])

        const response = output.toResponse()
        expect(response.status).toBe(302)

        expect(createOAuthTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({
                redirectTo: "/dashboard",
            })
        )
    })

    test("signIn OIDC custom provider stores nonce in OAuth transaction", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => openIDMetadata,
            }))
        )

        const createOAuthTransactionMock = vi.fn().mockResolvedValue({
            id: "transaction-123",
            provider: "oidc-provider",
            state: "state-value",
            nonce: "nonce-value",
            codeVerifier: "code-verifier",
            redirectURI: "https://example.com/auth/callback/oidc-provider",
            redirectTo: null,
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        })

        const { api } = authInstance({
            createOAuthTransaction: createOAuthTransactionMock,
        })

        const output = await api.signIn("oidc-provider")

        expect(output).toEqual({
            success: true,
            redirect: true,
            signInURL: expect.stringMatching(openIDMetadata.authorization_endpoint),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSetCookies([])

        expect(createOAuthTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({
                nonce: expect.any(String),
            })
        )
    })
})
