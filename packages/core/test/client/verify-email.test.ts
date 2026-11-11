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

test("verifyEmail verifies token successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmail("verify-token-123")

    expect(get).toHaveBeenCalledWith("/emailVerification/verify", {
        searchParams: { token: "verify-token-123", redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("verifyEmail with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/verified" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmail("verify-token-123", { redirectTo: "/verified" })

    expect(get).toHaveBeenCalledWith("/emailVerification/verify", {
        searchParams: { token: "verify-token-123", redirect: false, redirectTo: "/verified" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/verified" })
})

test("verifyEmail returns failure on invalid token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 422))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmail("invalid-token")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("verifyEmail returns failure on network error", async () => {
    const get = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyEmail("verify-token-123")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})
