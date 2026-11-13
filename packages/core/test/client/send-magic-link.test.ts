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

test("sendMagicLink sends magic link successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com")

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: undefined },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("sendMagicLink returns failure when CSRF token is missing", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
    const post = vi.fn()

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com")

    expect(post).not.toHaveBeenCalled()
    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("sendMagicLink returns failure on network error", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("sendMagicLink with redirectTo option", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com", { redirectTo: "/check-email" })

    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("sendMagicLink with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com", { redirect: false, redirectTo: "/check-email" })

    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("sendMagicLink with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/check-email" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.sendMagicLink("john@example.com", { redirect: true, redirectTo: "/check-email" })

    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/check-email" })
    expect(window.location.assign).toHaveBeenCalledWith("/check-email")
})

test("sendMagicLink prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const response = await client.sendMagicLink("john@example.com", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: "/home" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})

test("sendMagicLink uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const response = await client.sendMagicLink("john@example.com", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
        body: { email: "john@example.com" },
        searchParams: { redirect: false, redirectTo: "/home" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
