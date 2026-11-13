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

test("signUp", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            redirectURL: "/welcome",
        })
    )

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    await client.signUp({
        payload: { username: "John", lastName: "Doe", password: "1234567890" },
        redirectTo: "/welcome",
        redirect: true,
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signUp", {
        body: { username: "John", lastName: "Doe", password: "1234567890" },
        searchParams: {
            redirectTo: "/welcome",
            redirect: false,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
})

test("signUp with error", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockThrow(/Error/)

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signUp({ payload: { username: "John", lastName: "Doe", password: "1234567890" } })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signUp", {
        body: { username: "John", lastName: "Doe", password: "1234567890" },
        searchParams: {
            redirectTo: undefined,
            redirect: false,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("signUp with redirect option", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            redirect: false,
            redirectURL: "/welcome",
        })
    )

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signUp({
        payload: { username: "John", lastName: "Doe", password: "1234567890" },
        redirectTo: "/welcome",
        redirect: true,
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signUp", {
        body: { username: "John", lastName: "Doe", password: "1234567890" },
        searchParams: {
            redirectTo: "/welcome",
            redirect: false,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/welcome")
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/welcome" })
})

test("signUp with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/welcome" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { username: "John", lastName: "Doe", password: "1234567890" }
    const response = await client.signUp({ payload, redirect: false, redirectTo: "/welcome" })

    expect(post).toHaveBeenCalledWith("/signUp", {
        body: payload,
        searchParams: { redirectTo: "/welcome", redirect: false },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/welcome" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("signUp with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/welcome" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { username: "John", lastName: "Doe", password: "1234567890" }
    const response = await client.signUp({ payload, redirect: true, redirectTo: "/welcome" })

    expect(post).toHaveBeenCalledWith("/signUp", {
        body: payload,
        searchParams: { redirectTo: "/welcome", redirect: false },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/welcome" })
    expect(window.location.assign).toHaveBeenCalledWith("/welcome")
})

test("signUp prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const payload = { username: "John", lastName: "Doe", password: "1234567890" }
    const response = await client.signUp({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/signUp", {
        body: payload,
        searchParams: { redirectTo: "/home", redirect: false },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("signUp uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const payload = { username: "John", lastName: "Doe", password: "1234567890" }
    const response = await client.signUp({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(post).toHaveBeenCalledWith("/signUp", {
        body: payload,
        searchParams: { redirectTo: "/home", redirect: false },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
