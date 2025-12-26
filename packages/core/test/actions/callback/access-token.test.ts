import { describe, test, expect, vi } from "vitest"
import { AuthError } from "@/errors.js"
import { createPKCE } from "@/secure.js"
import { oauthCustomService } from "@test/presets.js"
import { createAccessToken } from "@/actions/callback/access-token.js"

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
        })
        expect(accessToken).toEqual(mockResponse)
    })

    test("with invalid oauth config", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                json: async () => {},
            }))
        )

        await expect(
            createAccessToken(
                {
                    ...oauthCustomService,
                    userInfo: "invalid-url",
                },
                "https://myapp.com/auth/callback/oauth",
                "authorization_code_123",
                codeVerifier
            )
        ).rejects.toBeInstanceOf(AuthError)
        expect(fetch).not.toHaveBeenCalled()
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
        ).rejects.toThrow(/Network Fetch error/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(bodyParams).toString(),
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
        ).rejects.toThrow(/Invalid grant/)

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
        ).rejects.toThrow(/Invalid access token response format/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(bodyParams).toString(),
        })
    })
})
