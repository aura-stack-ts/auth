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

test("signOut", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ redirect: true, url: "/logout" }, 202))

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signOut({ redirectTo: "/logout" })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signOut", {
        searchParams: {
            redirect: false,
            redirectTo: "/logout",
            token_type_hint: "session_token",
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(response).toEqual({ redirect: true, url: "/logout" })
})

test("signOut with invalid CSRF Token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
    const post = vi.fn()

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    expect(await client.signOut()).toMatchObject({ success: false, redirect: false, redirectURL: "/" })
    expect(post).not.toHaveBeenCalled()
})

test("signOut with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/logout" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signOut({ redirect: false, redirectTo: "/logout" })

    expect(post).toHaveBeenCalledWith("/signOut", {
        searchParams: { redirectTo: "/logout", redirect: false, token_type_hint: "session_token" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/logout" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("signOut with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/logout" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signOut({ redirect: true, redirectTo: "/logout" })

    expect(post).toHaveBeenCalledWith("/signOut", {
        searchParams: { redirectTo: "/logout", redirect: false, token_type_hint: "session_token" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/logout" })
    expect(window.location.assign).toHaveBeenCalledWith("/logout")
})

test("signOut prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const response = await client.signOut({
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/signOut", {
        searchParams: {
            redirectTo: "/home",
            redirect: false,
            token_type_hint: "session_token",
        },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("signOut uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const response = await client.signOut({ redirect: true, redirectTo: "https://untrusted.example/dashboard" })

    expect(post).toHaveBeenCalledWith("/signOut", {
        searchParams: {
            redirectTo: "/home",
            redirect: false,
            token_type_hint: "session_token",
        },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
