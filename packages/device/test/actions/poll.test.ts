import { describe, test, expect, vi, afterEach, beforeEach } from "vitest"
import { poll } from "@/actions/poll.ts"
import { authorize } from "@/actions/authorize.ts"
import { DeviceAuthError, DeviceOAuthError } from "@/shared/errors.ts"
import type { DeviceProviderCredentials } from "@/@types/device.ts"
import type { PendingDeviceAuth } from "@/@types/config.ts"

const githubProvider: DeviceProviderCredentials = {
    id: "github",
    name: "GitHub",
    clientId: "test-client-id",
    deviceAuthorization: {
        url: "https://github.com/login/device/code",
        params: { scope: "read:user" },
    },
    accessToken: "https://github.com/login/oauth/access_token",
    userInfo: "https://api.github.com/user",
    profile: (profile: Record<string, unknown>) => ({
        sub: String(profile.id),
        name: String(profile.login),
    }),
}

const tokenSuccess = {
    access_token: "access-token",
    token_type: "bearer",
    scope: "read:user",
}

const userProfile = { id: 42, login: "octocat" }

let pending: PendingDeviceAuth | null = null

const context = {
    providers: { github: githubProvider },
    getPending: () => pending,
    setPending: (value: PendingDeviceAuth | null) => {
        pending = value
    },
}

beforeEach(() => {
    pending = {
        providerId: "github",
        deviceCode: "device-code-123",
        interval: 0.001,
        expiresAt: Date.now() + 60_000,
    }
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    pending = null
})

describe("poll", () => {
    test("polls until token is issued then fetches userinfo", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ error: "authorization_pending" }), { status: 400 })
            )
            .mockResolvedValueOnce(new Response(JSON.stringify(tokenSuccess), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(userProfile), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const pollFn = poll(context)
        const pollPromise = pollFn({ interval: 0.001 })

        await vi.runAllTimersAsync()
        const session = await pollPromise

        expect(session).toEqual({
            accessToken: "access-token",
            tokenType: "bearer",
            scope: "read:user",
            user: { sub: "42", name: "octocat" },
        })

        expect(fetchMock).toHaveBeenCalledTimes(3)
        const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(tokenUrl).toBe("https://github.com/login/oauth/access_token")
        expect(tokenInit?.body?.toString()).toContain("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code")
        expect(tokenInit?.body?.toString()).toContain("device_code=device-code-123")
        expect(tokenInit?.body?.toString()).toContain("client_id=test-client-id")
    })

    test("accepts explicit providerId and deviceCode", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(new Response(JSON.stringify(tokenSuccess), { status: 200 }))
                .mockResolvedValueOnce(new Response(JSON.stringify(userProfile), { status: 200 }))
        )

        const pollFn = poll({ providers: { github: githubProvider } })
        const session = await pollFn({
            providerId: "github",
            deviceCode: "explicit-device-code",
            interval: 5,
            timeout: 60_000,
        })

        expect(session.user).toEqual({ sub: "42", name: "octocat" })
        const [, tokenInit] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
        expect(tokenInit?.body?.toString()).toContain("device_code=explicit-device-code")
    })

    test("throws when neither pending nor explicit inputs are provided", async () => {
        pending = null
        const pollFn = poll(context)
        await expect(pollFn()).rejects.toThrow(DeviceAuthError)
    })

    test("throws when only partial explicit inputs are provided", async () => {
        const pollFn = poll(context)
        await expect(pollFn({ providerId: "github" })).rejects.toThrow(DeviceAuthError)
    })

    test("throws DeviceOAuthError on expired_token", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ error: "expired_token", error_description: "Expired" }), { status: 400 })
            )
        )

        const pollFn = poll(context)
        await expect(pollFn({ interval: 0.001 })).rejects.toThrow(DeviceOAuthError)
    })

    test("increases interval on slow_down", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ error: "slow_down" }), { status: 400 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(tokenSuccess), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(userProfile), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const pollFn = poll(context)
        const pollPromise = pollFn({ interval: 1 })

        await vi.runAllTimersAsync()
        await pollPromise

        expect(fetchMock).toHaveBeenCalledTimes(3)
    })
})

describe("authorize + poll integration via pending state", () => {
    test("authorize sets pending for implicit poll", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        device_code: "dc",
                        user_code: "UC",
                        verification_uri: "https://example.com/device",
                        expires_in: 60,
                        interval: 1,
                    }),
                    { status: 200 }
                )
            )
        )

        const authorizeFn = authorize(context)
        await authorizeFn("github")

        expect(pending).toMatchObject({
            providerId: "github",
            deviceCode: "dc",
            interval: 1,
        })
    })
})
