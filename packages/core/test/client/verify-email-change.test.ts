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

test("verifyEmailChange with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/email-updated" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { token: "change-token-abc" }
    const response = await client.verifyEmailChange({ payload, redirect: false, redirectTo: "/email-updated" })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: payload.token, redirect: false, redirectTo: "/email-updated" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/email-updated" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("verifyEmailChange with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/email-updated" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { token: "change-token-abc" }
    const response = await client.verifyEmailChange({ payload, redirect: true, redirectTo: "/email-updated" })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: payload.token, redirect: false, redirectTo: "/email-updated" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/email-updated" })
    expect(window.location.assign).toHaveBeenCalledWith("/email-updated")
})

test("verifyEmailChange prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const payload = { token: "change-token-abc" }
    const response = await client.verifyEmailChange({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: payload.token, redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("verifyEmailChange uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const payload = { token: "change-token-abc" }
    const response = await client.verifyEmailChange({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(get).toHaveBeenCalledWith("/email/change/verify", {
        searchParams: { token: payload.token, redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
