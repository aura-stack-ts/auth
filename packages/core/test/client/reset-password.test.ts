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

test("resetPassword resets password successfully", async () => {
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.resetPassword({
        payload: { token: "reset-token-abc", newPassword: "newpassword123" },
    })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: { token: "reset-token-abc", newPassword: "newpassword123" },
        searchParams: { redirect: false, redirectTo: undefined },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("resetPassword returns failure on invalid token", async () => {
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 422))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.resetPassword({
        payload: { token: "invalid-token", newPassword: "newpassword123" },
    })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("resetPassword returns failure on network error", async () => {
    const post = vi.fn().mockRejectedValue(new Error("Network error"))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.resetPassword({
        payload: { token: "reset-token-abc", newPassword: "newpassword123" },
    })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("resetPassword with redirectTo option", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/login" }))

    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.resetPassword({
        payload: { token: "reset-token-abc", newPassword: "newpassword123" },
        redirectTo: "/login",
    })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: { token: "reset-token-abc", newPassword: "newpassword123" },
        searchParams: { redirect: false, redirectTo: "/login" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/login" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("resetPassword with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/login" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { token: "reset-token-abc", newPassword: "newpassword123" }
    const response = await client.resetPassword({ payload, redirect: false, redirectTo: "/login" })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/login" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/login" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("resetPassword with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/login" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { token: "reset-token-abc", newPassword: "newpassword123" }
    const response = await client.resetPassword({ payload, redirect: true, redirectTo: "/login" })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/login" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/login" })
    expect(window.location.assign).toHaveBeenCalledWith("/login")
})

test("resetPassword prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const payload = { token: "reset-token-abc", newPassword: "newpassword123" }
    const response = await client.resetPassword({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("resetPassword uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get: vi.fn(), post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const payload = { token: "reset-token-abc", newPassword: "newpassword123" }
    const response = await client.resetPassword({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(post).toHaveBeenCalledWith("/password/reset", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/home" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
