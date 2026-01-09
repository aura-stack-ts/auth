import { describe, test, expect, vi } from "vitest"
import { getUserInfo } from "@/actions/callback/userinfo.js"
import { OAuthProviderConfig, OAuthProviderCredentials } from "@/@types/index.js"
import { oauthCustomService } from "@test/presets.js"

describe("getUserInfo", () => {
    test("get user info", async () => {
        const mockResponse = {
            sub: "12345",
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

        const response = await getUserInfo(oauthCustomService, "access_token_123")

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
            signal: expect.any(AbortSignal),
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

        const oauthConfig: OAuthProviderConfig<{ username: string; avatar_url: string; uniqueId: string; email: string }> = {
            ...oauthCustomService,
            profile(profile) {
                return {
                    sub: profile.uniqueId,
                    name: profile.username,
                    email: profile.email,
                    image: profile.avatar_url,
                }
            },
        }

        const response = await getUserInfo(oauthConfig as OAuthProviderCredentials, "access_token_123")

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
            signal: expect.any(AbortSignal),
        })
        expect(response).toEqual({
            sub: "12345",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "http://example.com/john-doe.jpg",
        })
    })

    test("throw error in custom profile function", async () => {
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

        const oauthConfig: OAuthProviderConfig = {
            ...oauthCustomService,
            profile() {
                throw new Error("Profile parsing error")
            },
        }

        await expect(getUserInfo(oauthConfig as OAuthProviderCredentials, "access_token_123")).rejects.toThrow(
            /Profile parsing error/
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
            signal: expect.any(AbortSignal),
        })
    })

    test("with valid error response", async () => {
        const mockResponse = {
            error: "acess_denied",
            error_description: "Invalid access token",
        }

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: false,
                json: async () => mockResponse,
            }))
        )

        await expect(getUserInfo(oauthCustomService, "invalid_access_token")).rejects.toThrow(/Invalid access token/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer invalid_access_token",
            },
            signal: expect.any(AbortSignal),
        })
    })

    test("fetch throws error", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("Fetch Network error")
            })
        )

        await expect(getUserInfo(oauthCustomService, "access_token")).rejects.toThrow(/Fetch Network error/)

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_token",
            },
            signal: expect.any(AbortSignal),
        })
    })
})
