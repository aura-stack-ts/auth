import { describe, test, expect, vi } from "vitest"
import { createPKCE } from "@/shared/crypto.ts"
import { oauthCustomService, openIDCustomProvider, openIDMetadata } from "@test/presets.ts"
import { createAccessToken } from "@/actions/callback/access-token.ts"
import { resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"

describe("createAccessToken", async () => {
    const { codeVerifier } = await createPKCE()

    const bodyParams = {
        client_id: "oauth_client_id",
        client_secret: "oauth_client_secret",
        code: "authorization_code_123",
        redirect_uri: "https://myapp.com/auth/callback/oauth-provider",
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
    }

    test("get access token", async () => {
        const mockResponse = {
            access_token: "access_token",
            token_type: "bearer",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        const accessToken = await createAccessToken(
            oauthCustomService,
            "https://myapp.com/auth/callback/oauth-provider",
            "authorization_code_123",
            codeVerifier
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(bodyParams).toString(),
            signal: expect.any(AbortSignal),
        })
        expect(accessToken).toEqual(mockResponse)
    })

    test("with failed fetch", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("Network Fetch error")
            })
        )

        await expect(
            createAccessToken(
                oauthCustomService,
                "https://myapp.com/auth/callback/oauth-provider",
                "authorization_code_123",
                codeVerifier
            )
        ).rejects.toThrow(
            /An unexpected runtime code path crash or unclassified transport exception occurred during the remote provider access token exchange execution flow./
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(bodyParams).toString(),
            signal: expect.any(AbortSignal),
        })
    })

    test("with error and error_description", async () => {
        const mockResponse = {
            error: "invalid_grant",
            error_description: "Invalid grant",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        await expect(
            createAccessToken(oauthCustomService, "https://myapp.com/auth/callback/oauth-provider", "invalid_code", codeVerifier)
        ).rejects.toThrow(
            "The third-party authentication server responded with an HTTP status 200, but the returned data block structure fails schema verification (e.g. missing 'access_token')."
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                ...bodyParams,
                code: "invalid_code",
            }).toString(),
            signal: expect.any(AbortSignal),
        })
    })

    test("with invalid response format", async () => {
        const mockResponse = {
            message: "Some unexpected format error",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        await expect(
            createAccessToken(
                oauthCustomService,
                "https://myapp.com/auth/callback/oauth-provider",
                "authorization_code_123",
                codeVerifier
            )
        ).rejects.toThrow(
            "The third-party authentication server responded with an HTTP status 200, but the returned data block structure fails schema verification (e.g. missing 'access_token')."
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(bodyParams).toString(),
            signal: expect.any(AbortSignal),
        })
    })

    test("OIDC provider", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => openIDMetadata,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => ({
                access_token: "access_123",
                token_type: "Bearer",
            }),
        })

        const config = await resolveOpenIDProvider({
            ...openIDCustomProvider,
            oidc: { issuer: openIDCustomProvider.issuer },
        } as unknown as RuntimeOAuthProvider)

        expect(fetch).toHaveBeenCalledWith("https://id.example.com/.well-known/openid-configuration", {
            headers: { Accept: "application/json" },
            signal: expect.any(AbortSignal),
        })

        const accessToken = await createAccessToken(
            config,
            "http://localhost:3000/auth/callback/openid-provider",
            "authorization_code_123",
            codeVerifier
        )

        expect(accessToken).toEqual({
            access_token: "access_123",
            token_type: "Bearer",
        })

        expect(fetch).toHaveBeenCalledWith("https://id.example.com/oauth/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oidc_client_id",
                client_secret: "oidc_client_secret",
                code: "authorization_code_123",
                redirect_uri: "http://localhost:3000/auth/callback/openid-provider",
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }).toString(),
            signal: expect.any(AbortSignal),
        })
    })
})
