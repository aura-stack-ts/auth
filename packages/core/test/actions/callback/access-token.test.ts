import { describe, test, expect, vi } from "vitest"
import { createAccessToken } from "@/actions/callback/access-token.js"
import { OAuthSecureConfig } from "@/@types/index.js"

describe("createAccessToken", () => {
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
            {
                id: "oauth-integration",
                name: "OAuth",
                authorizeURL: "https://example.com/oauth/authorize",
                accessToken: "https://example.com/oauth/access_token",
                scope: "profile email",
                responseType: "code",
                userInfo: "https://example.com/oauth/userinfo",
                clientId: "oauth_client_id",
                clientSecret: "oauth_client_secret",
            },
            "https://myapp.com/auth/callback/oauth-integration",
            "authorization_code_123"
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "authorization_code_123",
                redirect_uri: "https://myapp.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
            }).toString(),
        })
        expect(accessToken).toBe("access_token")
    })

    test("with invalid oauth config", async () => {
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

        await expect(
            createAccessToken(
                {
                    id: "oauth-integration",
                    name: "OAuth",
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    scope: "profile email",
                    responseType: "code",
                    userInfo: "https://example.com/oauth/userinfo",
                } as OAuthSecureConfig,
                "https://myapp.com/auth/callback/oauth-integration",
                "authorization_code_123"
            )
        ).rejects.toThrow(/Invalid OAuth configuration/)
        expect(fetch).not.toHaveBeenCalled()
    })

    test("with failed fetch", async () => {
        const mockResponse = {
            access_token: "access_token",
            token_type: "bearer",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: false,
                json: async () => mockResponse,
            }))
        )

        await expect(
            createAccessToken(
                {
                    id: "oauth-integration",
                    name: "OAuth",
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    scope: "profile email",
                    responseType: "code",
                    userInfo: "https://example.com/oauth/userinfo",
                    clientId: "oauth_client_id",
                    clientSecret: "oauth_client_secret",
                },
                "https://myapp.com/auth/callback/oauth-integration",
                "authorization_code_123"
            )
        ).rejects.toThrow(/Failed to retrieve accessToken from OAuth/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "authorization_code_123",
                redirect_uri: "https://myapp.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
            }).toString(),
        })
    })

    test("with error response", async () => {
        const mockResponse = {
            error: "access_token",
            error_description: "Invalid grant",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                json: async () => mockResponse,
            }))
        )

        const response = (await createAccessToken(
            {
                id: "oauth-integration",
                name: "OAuth",
                authorizeURL: "https://example.com/oauth/authorize",
                accessToken: "https://example.com/oauth/access_token",
                scope: "profile email",
                responseType: "code",
                userInfo: "https://example.com/oauth/userinfo",
                clientId: "oauth_client_id",
                clientSecret: "oauth_client_secret",
            },
            "https://myapp.com/auth/callback/oauth-integration",
            "authorization_code_123"
        )) as Response

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "authorization_code_123",
                redirect_uri: "https://myapp.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
            }).toString(),
        })
        expect(await response.json()).toEqual(mockResponse)
    })

    test("with invalid response format", async () => {
        const mockResponse = {
            message: "Some unexpected error",
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
                {
                    id: "oauth-integration",
                    name: "OAuth",
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    scope: "profile email",
                    responseType: "code",
                    userInfo: "https://example.com/oauth/userinfo",
                    clientId: "oauth_client_id",
                    clientSecret: "oauth_client_secret",
                },
                "https://myapp.com/auth/callback/oauth-integration",
                "authorization_code_123"
            )
        ).rejects.toThrow(/Failed to retrieve accessToken from OAuth/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "authorization_code_123",
                redirect_uri: "https://myapp.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
            }).toString(),
        })
    })
})
