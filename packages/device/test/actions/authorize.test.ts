import { describe, test, expect, vi, afterEach } from "vitest"
import { authorize } from "@/actions/authorize.ts"
import { DeviceAuthError, DeviceOAuthError } from "@/shared/errors.ts"
import type { DeviceProviderCredentials } from "@/@types/device.ts"

const githubProvider: DeviceProviderCredentials = {
    id: "github",
    name: "GitHub",
    clientId: "test-client-id",
    deviceAuthorization: {
        url: "https://github.com/login/device/code",
        params: { scope: "read:user user:email" },
    },
    accessToken: "https://github.com/login/oauth/access_token",
    userInfo: "https://api.github.com/user",
}

const deviceAuthResponse = {
    device_code: "device-code-123",
    user_code: "ABCD-1234",
    verification_uri: "https://github.com/login/device",
    verification_uri_complete: "https://github.com/login/device?user_code=ABCD-1234",
    expires_in: 900,
    interval: 5,
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("authorize", () => {
    test("POSTs client_id and scope to device authorization endpoint", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify(deviceAuthResponse), { status: 200 })
        )
        vi.stubGlobal("fetch", fetchMock)

        const setPending = vi.fn()
        const authorizeFn = authorize({
            providers: { github: githubProvider },
            setPending,
        })

        const result = await authorizeFn("github")

        expect(fetchMock).toHaveBeenCalledOnce()
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe("https://github.com/login/device/code")
        expect(init?.method).toBe("POST")
        expect(init?.headers).toMatchObject({
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        })
        expect(init?.body?.toString()).toBe("client_id=test-client-id&scope=read%3Auser+user%3Aemail")

        expect(result).toEqual({
            deviceCode: "device-code-123",
            userCode: "ABCD-1234",
            verificationURI: "https://github.com/login/device",
            verificationURIComplete: "https://github.com/login/device?user_code=ABCD-1234",
            expiresIn: 900,
            interval: 5,
        })

        expect(setPending).toHaveBeenCalledWith(
            expect.objectContaining({
                providerId: "github",
                deviceCode: "device-code-123",
                interval: 5,
            })
        )
    })

    test("throws DeviceAuthError when provider is not found", async () => {
        const authorizeFn = authorize({ providers: { github: githubProvider } })
        await expect(authorizeFn("unknown" as "github")).rejects.toThrow(DeviceAuthError)
    })

    test("throws DeviceOAuthError on HTTP error response", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ error: "invalid_client", error_description: "Bad client" }), {
                    status: 401,
                })
            )
        )

        const authorizeFn = authorize({ providers: { github: githubProvider } })
        await expect(authorizeFn("github")).rejects.toThrow(DeviceOAuthError)
    })
})
