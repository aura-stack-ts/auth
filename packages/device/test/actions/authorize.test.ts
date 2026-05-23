import { describe, test, expect, vi, afterEach } from "vitest"
import { authorize } from "@/actions/authorize.ts"
import { DeviceAuthError, DeviceOAuthError } from "@/shared/errors.ts"
import { createBuiltInDeviceProviders } from "@/providers/index.ts"

const deviceAuthResponse = {
    device_code: "device-code-123",
    user_code: "ABCD-1234",
    verification_uri: "https://github.com/login/device",
    verification_uri_complete: "https://github.com/login/device?user_code=ABCD-1234",
    expires_in: 900,
    interval: 5,
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
})

describe("authorize", () => {
    test("unsupported provider", async () => {
        const authorizeFn = authorize({ providers: createBuiltInDeviceProviders() })
        await expect(authorizeFn("unsupported")).rejects.toThrow(/Provider with id unsupported not found/)
    })

    test("POSTs client_id and scope to device authorization endpoint", async () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")

        const fetchMock = vi.fn().mockResolvedValue(Response.json(deviceAuthResponse))
        vi.stubGlobal("fetch", fetchMock)

        const setPending = vi.fn()
        const authorizeFn = authorize({
            providers: createBuiltInDeviceProviders(["github"]),
            setPending,
        })

        const authorizationResponse = await authorizeFn("github")

        expect(fetchMock).toHaveBeenCalledWith("https://github.com/login/device/code", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "test-client-id",
                scope: "read:user user:email",
            }),
            signal: expect.any(AbortSignal),
        })

        expect(authorizationResponse).toEqual({
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

    test("fails to parse JSON response", async () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid json", { status: 200 })))

        const authorizeFn = authorize({ providers: createBuiltInDeviceProviders(["github"]) })
        await expect(authorizeFn("github")).rejects.toThrow(/Failed to parse device authorization response/)
    })

    test("incomplete response missing required fields", async () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ device_code: "code" })))

        const authorizeFn = authorize({ providers: createBuiltInDeviceProviders(["github"]) })
        await expect(authorizeFn("github")).rejects.toThrow(/Failed to parse device authorization response/)
    })

    test("throws DeviceAuthError when provider is not found", async () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")

        const authorizeFn = authorize({ providers: createBuiltInDeviceProviders(["github"]) })
        await expect(authorizeFn("unknown" as "github")).rejects.toThrow(DeviceAuthError)
    })

    test("throws DeviceOAuthError on HTTP error response", async () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                Response.json(
                    { error: "invalid_client", error_description: "Bad client" },
                    {
                        status: 401,
                    }
                )
            )
        )

        const authorizeFn = authorize({ providers: createBuiltInDeviceProviders(["github"]) })
        await expect(authorizeFn("github")).rejects.toThrow(DeviceOAuthError)
    })
})
