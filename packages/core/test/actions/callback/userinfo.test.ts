import { describe, test, expect, vi } from "vitest"
import { getUserInfo } from "@/actions/callback/userinfo.js"
import { OAuthConfig, OAuthSecureConfig } from "@/@types/index.js"

describe("getUserInfo", () => {
    test("get user info", async () => {
        const mockResponse = {
            id: "12345",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "http://example.com/john-doe.jpg",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                json: async () => mockResponse,
            }))
        )

        const response = await getUserInfo(
            {
                id: "oauth-integration",
                name: "OAuth",
                authorizeURL: "https://example.com/oauth/authorize",
                accessToken: "https://example.com/oauth/token",
                scope: "profile email",
                responseType: "code",
                userInfo: "https://example.com/oauth/userinfo",
                clientId: "oauth_client_id",
                clientSecret: "oauth_client_secret",
            },
            "access_token_123"
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
        })
        expect(response).toEqual(mockResponse)
    })

    test("get user info with custom profile function", async () => {
        const mockResponse = {
            uniqueId: "12345",
            username: "John Doe",
            email: "john.doe@example.com",
            avatar_url: "http://example.com/john-doe.jpg",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                json: async () => mockResponse,
            }))
        )

        const oauthConfig: OAuthConfig<{ username: string; avatar_url: string; uniqueId: string; email: string }> = {
            id: "oauth-integration",
            name: "OAuth",
            authorizeURL: "https://example.com/oauth/authorize",
            accessToken: "https://example.com/oauth/token",
            scope: "profile email",
            responseType: "code",
            userInfo: "https://example.com/oauth/userinfo",
            profile(profile) {
                return {
                    id: profile.uniqueId,
                    name: profile.username,
                    email: profile.email,
                    image: profile.avatar_url,
                }
            },
        }

        const response = await getUserInfo(oauthConfig as OAuthSecureConfig, "access_token_123")

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
        })
        expect(response).toEqual({
            id: "12345",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "http://example.com/john-doe.jpg",
        })
    })

    test("invalid response", async () => {
        const mockResponse = {
            error: "invalid_access_token",
            error_description: "The access token provided is invalid.",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: false,
                json: async () => mockResponse,
            }))
        )

        const response = (await getUserInfo(
            {
                id: "oauth-integration",
                name: "OAuth",
                authorizeURL: "https://example.com/oauth/authorize",
                accessToken: "https://example.com/oauth/token",
                scope: "profile email",
                responseType: "code",
                userInfo: "https://example.com/oauth/userinfo",
                clientId: "oauth_client_id",
                clientSecret: "oauth_client_secret",
            },
            "invalid_access_token"
        )) as Response

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer invalid_access_token",
            },
        })
        expect(await response.json()).toEqual(mockResponse)
    })
})
