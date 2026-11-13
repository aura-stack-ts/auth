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

test("updateSession without csrf token", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
    const patch = vi.fn()

    createClientMock.mockReturnValue({
        get,
        patch,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires: new Date().toISOString() },
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(patch).not.toHaveBeenCalled()
    expect(response).toEqual({ success: false, session: null })
})

test("updateSession with valid session", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))

    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
        })
    )

    createClientMock.mockReturnValue({
        get,
        patch,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires: expires.toISOString() },
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: {
            user: { name: "Alice" },
            expires,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
        searchParams: {
            redirect: false,
            redirectTo: undefined,
        },
    })
    expect(response).toEqual({ success: true, session: { user: { id: "user_1", name: "Alice" } } })
})

test("updateSession with no session", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const patch = vi.fn()

    createClientMock.mockReturnValue({
        get,
        patch,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.updateSession({ session: {} })
    expect(response).toEqual({ success: false, session: null })
})

test("updateSession with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))

    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
            redirectURL: "/dashboard",
        })
    )

    createClientMock.mockReturnValue({
        get,
        patch,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const expires = new Date(Math.floor(Date.now() / 1000) + 60 * 60 * 1000)
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires: expires.toISOString() },
        redirect: true,
        redirectTo: "/dashboard",
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: {
            user: { name: "Alice" },
            expires,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
        searchParams: {
            redirect: false,
            redirectTo: "/dashboard",
        },
    })
    expect(response).toEqual({ success: true, session: { user: { id: "user_1", name: "Alice" } }, redirectURL: "/dashboard" })
})

test("updateSession with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
            redirect: false,
            redirectURL: "/dashboard",
        })
    )
    createClientMock.mockReturnValue({ get, patch })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const expires = new Date(Date.now() + 60_000).toISOString()
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires },
        redirect: false,
        redirectTo: "/dashboard",
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: { user: { name: "Alice" }, expires: new Date(expires) },
        headers: { "X-CSRF-Token": "csrf_token_1" },
        searchParams: { redirectTo: "/dashboard", redirect: false },
    })
    expect(response).toEqual({
        success: true,
        session: { user: { id: "user_1", name: "Alice" } },
        redirect: false,
        redirectURL: "/dashboard",
    })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("updateSession with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
            redirect: true,
            redirectURL: "/dashboard",
        })
    )
    createClientMock.mockReturnValue({ get, patch })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const expires = new Date(Date.now() + 60_000).toISOString()
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires },
        redirect: true,
        redirectTo: "/dashboard",
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: { user: { name: "Alice" }, expires: new Date(expires) },
        headers: { "X-CSRF-Token": "csrf_token_1" },
        searchParams: { redirectTo: "/dashboard", redirect: false },
    })
    expect(response).toEqual({
        success: true,
        session: { user: { id: "user_1", name: "Alice" } },
        redirect: true,
        redirectURL: "/dashboard",
    })
    expect(window.location.assign).toHaveBeenCalledWith("/dashboard")
})

test("updateSession prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
            redirect: true,
            redirectURL: "/admin/settings",
        })
    )
    createClientMock.mockReturnValue({ get, patch })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const session = { user: { name: "Alice" }, expires: new Date(Date.now() + 60_000).toISOString() }
    const response = await client.updateSession({
        session,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: { user: { name: "Alice" }, expires: new Date(session.expires) },
        headers: { "X-CSRF-Token": "csrf_token_1" },
        searchParams: { redirectTo: "/home", redirect: false },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({
        success: true,
        session: { user: { id: "user_1", name: "Alice" } },
        redirect: true,
        redirectURL: "/admin/settings",
    })
})

test("updateSession uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const patch = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            session: { user: { id: "user_1", name: "Alice" } },
            redirect: true,
            redirectURL: "/home",
        })
    )
    createClientMock.mockReturnValue({ get, patch })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const expires = new Date(Date.now() + 60_000).toISOString()
    const response = await client.updateSession({
        session: { user: { name: "Alice" }, expires },
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(patch).toHaveBeenCalledWith("/session", {
        body: { user: { name: "Alice" }, expires: new Date(expires) },
        headers: { "X-CSRF-Token": "csrf_token_1" },
        searchParams: { redirectTo: "/home", redirect: false },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({
        success: true,
        session: { user: { id: "user_1", name: "Alice" } },
        redirect: true,
        redirectURL: "/home",
    })
})
