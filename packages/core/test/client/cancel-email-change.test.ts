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

test("cancelEmailChange cancels via token", async () => {
    const get = vi.fn()

    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({ payload: { token: "cancel-token-abc" } })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("cancelEmailChange cancels for authenticated user without token", async () => {
    const get = vi.fn()

    get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({})

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: undefined, redirect: false, redirectTo: undefined },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("cancelEmailChange via token does not require a CSRF token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({ payload: { token: "cancel-token-abc" } })

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("cancelEmailChange with redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn()
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: "/settings" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirectTo: "/settings",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/settings" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/settings" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("cancelEmailChange with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn()
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: "/settings" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirect: false,
        redirectTo: "/settings",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/settings" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/settings" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("cancelEmailChange with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn()
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: true, redirectURL: "/settings" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirect: true,
        redirectTo: "/settings",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/settings" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/settings" })
})

test("cancelEmailChange uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn()
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirect: true,
        redirectTo: "https://devil.com/settings",
        fallbackRedirectTo: "/home",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})

test("cancelEmailChange prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})

test("cancelEmailChange sets / as trusted redirectTo value", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn()
    get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: true, redirectURL: "/" }))

    createClientMock.mockReturnValue({ get, post: vi.fn() })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "https://superdevil.com/settings" })
    const response = await client.cancelEmailChange({
        payload: { token: "cancel-token-abc" },
        redirect: true,
        redirectTo: "https://devil.com/admin",
        fallbackRedirectTo: "https://hyperdevil.com/admin",
    })

    expect(get).toHaveBeenCalledWith("/email/change/cancel", {
        searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/" })
})
