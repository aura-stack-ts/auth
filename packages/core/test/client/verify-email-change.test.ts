import { expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient } from "@aura-stack/router"

vi.mock(import("@aura-stack/router"), async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        createClient: vi.fn(),
    }
})

const createClientMock = vi.mocked(createClient)

const createJSONResponse = (body: unknown, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    })
}

test("verifyEmailChange verifies token successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmailChange({ payload: { token: "change-token-abc" } })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: "change-token-abc", redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("verifyEmailChange with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/email-updated" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmailChange({
        payload: { token: "change-token-abc" },
        redirectTo: "/email-updated",
    })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: "change-token-abc", redirect: false, redirectTo: "/email-updated" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/email-updated" })
})

test("verifyEmailChange returns failure on invalid token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 401))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmailChange({ payload: { token: "invalid-token" } })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("verifyEmailChange returns failure on network error", async () => {
    const get = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmailChange({ payload: { token: "change-token-abc" } })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})
