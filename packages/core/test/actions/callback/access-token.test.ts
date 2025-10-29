import { describe, test, expect, vi } from "vitest"
import { createAccessToken } from "@/actions/callback/access-token.js"
import { OAuthSecureConfig } from "@/@types/index.js"
import { AuraAuthError } from "@/error.js"

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
        ).rejects.toBeInstanceOf(AuraAuthError)
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
        ).rejects.toThrow(/Network Fetch error/)

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

    test("with error and error_description", async () => {
        const mockResponse = {
            error: "access_denied",
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
                "invalid_code"
            )
        ).rejects.toThrow(/Invalid grant/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "invalid_code",
                redirect_uri: "https://myapp.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
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
        ).rejects.toThrow(/Invalid access token response format/)

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
