import { describe, test, expect, vi } from "vitest"
import { getUserInfo } from "@/actions/callback/userinfo.ts"
import { oauthCustomService } from "@test/presets.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"
import type { OAuthProviderConfig, OAuthProviderCredentials } from "@/@types/index.ts"

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
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        const response = await getUserInfo(oauthCustomService, {
            access_token: "access_token_123",
        })

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
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
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        type Profile = { username: string; avatar_url: string; uniqueId: string; email: string }
        const oauthConfig: OAuthProviderConfig<Profile> = {
            ...(oauthCustomService as unknown as OAuthProviderCredentials<Profile>),
            profile(profile) {
                return {
                    sub: profile.uniqueId,
                    name: profile.username,
                    email: profile.email,
                    image: profile.avatar_url,
                }
            },
        }

        const response = await getUserInfo(oauthConfig as OAuthProviderCredentials, {
            access_token: "access_token_123",
        })

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
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
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: async () => mockResponse,
            }))
        )

        const oauthConfig: OAuthProviderConfig = {
            ...oauthCustomService,
            profile() {
                throw new Error("Profile parsing error")
            },
        }

        await expect(
            getUserInfo(oauthConfig as OAuthProviderCredentials, {
                access_token: "access_token_123",
            })
        ).rejects.toThrow(
            /An unclassified system runtime breakdown occurred while trying to process data records down inside the developer's user profile normalization routine/
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
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

        await expect(
            getUserInfo(oauthCustomService, {
                access_token: "invalid_access_token",
            })
        ).rejects.toThrow(
            /The downstream endpoint fetch request to the provider user profile storage API returned an invalid response code status./
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
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

        await expect(
            getUserInfo(oauthCustomService, {
                access_token: "access_token",
            })
        ).rejects.toThrow(
            /An unmapped connection trap exploded during asynchronous background operations inside the default profile fetch pipeline routines./
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                Accept: "application/json",
                Authorization: "Bearer access_token",
            },
            signal: expect.any(AbortSignal),
        })
    })

    test("with custom userInfo function", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ name: "John Doe", email: "johndoe@example.com" }),
        })

        vi.stubGlobal("fetch", mockFetch)

        const oauthConfig: OAuthProviderConfig = {
            ...oauthCustomService,
            userInfo: {
                url: "https://example.com/oauth/userinfo",
                request: async (ctx) => {
                    const response = await fetch(ctx.userInfoURL, {
                        method: "GET",
                        headers: {
                            "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                        },
                        mode: "no-cors",
                    })
                    const json = await response.json()
                    return {
                        sub: ctx.accessToken,
                        name: json.name,
                        email: json.email,
                        image: "http://example.com/john-doe.jpg",
                    }
                },
            },
        }

        const profile = await getUserInfo(oauthConfig, {
            access_token: "access_token",
        })

        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
            },
            mode: "no-cors",
        })

        expect(profile).toEqual({
            sub: "access_token",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "http://example.com/john-doe.jpg",
        })
    })

    test("custom userInfo function throws error", async () => {
        const oauthConfig: OAuthProviderConfig = {
            ...oauthCustomService,
            userInfo: {
                url: "https://example.com/oauth/userinfo",
                request: async () => {
                    throw new Error("Custom userInfo error")
                },
            },
        }

        await expect(
            getUserInfo(oauthConfig, {
                access_token: "access_token",
            })
        ).rejects.toThrow(
            /An unclassified system runtime breakdown occurred while trying to process data records down inside the developer's user profile normalization routine/
        )
    })
})
