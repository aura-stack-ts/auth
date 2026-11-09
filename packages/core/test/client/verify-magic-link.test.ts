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

test("verifyMagicLink verifies token successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("magic-token-xyz")

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("verifyMagicLink with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/dashboard" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("magic-token-xyz", { redirectTo: "/dashboard" })

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/dashboard" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/dashboard" })
})

test("verifyMagicLink returns failure on invalid token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 422))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("invalid-token")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("verifyMagicLink returns failure on network error", async () => {
    const get = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("magic-token-xyz")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})
