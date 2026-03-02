import { describe, test, expect, vi } from "vitest"
import { createPKCE } from "@/secure.ts"
import { oauthCustomService } from "@test/presets.ts"
import { createAccessToken } from "@/actions/callback/access-token.ts"

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
        ).rejects.toThrow(/Failed to communicate with OAuth provider/)

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
                json: async () => mockResponse,
            }))
        )

        await expect(
            createAccessToken(oauthCustomService, "https://myapp.com/auth/callback/oauth-provider", "invalid_code", codeVerifier)
        ).rejects.toThrow(/Failed to communicate with OAuth provider/)

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
        ).rejects.toThrow(/Failed to communicate with OAuth provider/)

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
})
