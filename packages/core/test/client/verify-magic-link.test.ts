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

test("verifyMagicLink with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/dashboard" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("magic-token-xyz", { redirect: false, redirectTo: "/dashboard" })

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/dashboard" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/dashboard" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("verifyMagicLink with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/dashboard" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.verifyMagicLink("magic-token-xyz", { redirect: true, redirectTo: "/dashboard" })

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/dashboard" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/dashboard" })
    expect(window.location.assign).toHaveBeenCalledWith("/dashboard")
})

test("verifyMagicLink prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const response = await client.verifyMagicLink("magic-token-xyz", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("verifyMagicLink uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const response = await client.verifyMagicLink("magic-token-xyz", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
        searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
