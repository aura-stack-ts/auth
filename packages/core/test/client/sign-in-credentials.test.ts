import { expect, test, vi } from "vitest"
import { createClient } from "@aura-stack/router"
import { createAuthClient } from "@/client/client.ts"

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

test("signInCredentials", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            redirectURL: "/",
        })
    )

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signInCredentials({ payload: { username: "user", password: "pass" } })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: { username: "user", password: "pass" },
        searchParams: {
            redirect: false,
            redirectTo: undefined,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(response).toEqual({ success: true, redirectURL: "/" })
})

test("signInCredentials with invalid credentials", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(
        createJSONResponse(
            {
                success: false,
                redirectURL: null,
            },
            401
        )
    )

    createClientMock.mockReturnValue({
        get,
        post,
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signInCredentials({ payload: { username: "user", password: "wrong_pass" } })

    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: { username: "user", password: "wrong_pass" },
        searchParams: {
            redirect: false,
            redirectTo: undefined,
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("signInCredentials with redirectTo option", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
            redirectURL: "/dashboard",
        })
    )
    createClientMock.mockReturnValue({
        get,
        post,
    })
    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.signInCredentials({
        payload: { username: "user", password: "pass" },
        redirectTo: "/dashboard",
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: { username: "user", password: "pass" },
        searchParams: {
            redirect: false,
            redirectTo: "/dashboard",
        },
        headers: {
            "X-CSRF-Token": "csrf_token_1",
        },
    })
    expect(response).toEqual({ success: true, redirectURL: "/dashboard" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("signInCredentials with redirect: false & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/dashboard" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { username: "user", password: "pass" }
    const response = await client.signInCredentials({ payload, redirect: false, redirectTo: "/dashboard" })

    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/dashboard" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/dashboard" })
    expect(window.location.assign).not.toHaveBeenCalled()
})

test("signInCredentials with redirect: true & redirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/dashboard" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const payload = { username: "user", password: "pass" }
    const response = await client.signInCredentials({ payload, redirect: true, redirectTo: "/dashboard" })

    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/dashboard" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/dashboard" })
    expect(window.location.assign).toHaveBeenCalledWith("/dashboard")
})

test("signInCredentials prefers the per-call fallbackRedirectTo over the global fallback", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/admin/settings" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/admin/settings" })
    const payload = { username: "user", password: "pass" }
    const response = await client.signInCredentials({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
        fallbackRedirectTo: "/home",
    })

    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/home" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/admin/settings")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/admin/settings" })
})

test("signInCredentials uses the global fallbackRedirectTo", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } })

    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: true, redirectURL: "/home" }))
    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com", fallbackRedirectTo: "/home" })
    const payload = { username: "user", password: "pass" }
    const response = await client.signInCredentials({
        payload,
        redirect: true,
        redirectTo: "https://untrusted.example/dashboard",
    })

    expect(post).toHaveBeenCalledWith("/signIn/credentials", {
        body: payload,
        searchParams: { redirect: false, redirectTo: "/home" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(window.location.assign).toHaveBeenCalledWith("/home")
    expect(response).toEqual({ success: true, redirect: true, redirectURL: "/home" })
})
