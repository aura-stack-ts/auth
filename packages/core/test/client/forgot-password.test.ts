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

test("forgotPassword sends reset email successfully", async () => {
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.forgotPassword("user@example.com")

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("forgotPassword returns failure on network error", async () => {
    const post = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.forgotPassword("user@example.com")

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("forgotPassword with redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.forgotPassword("user@example.com", { redirectTo: "/check-email" })

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("forgotPassword with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.forgotPassword("user@example.com", {
        redirect: false,
        redirectTo: "/check-email",
    })

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("forgotPassword with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/check-email" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.forgotPassword("user@example.com", {
        redirect: true,
        redirectTo: "/check-email",
    })

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: "/check-email" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/check-email" })
    expect(window.location.assign).toHaveBeenCalledWith("/check-email")
})

test("forgotPassword uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const response = await client.forgotPassword("user@example.com", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})

test("forgotPassword prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const response = await client.forgotPassword("user@example.com", {
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/password/forgot", {
        body: { email: "user@example.com" },
        searchParams: { redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})
