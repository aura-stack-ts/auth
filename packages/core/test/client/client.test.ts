import { beforeEach, describe, expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient } from "@aura-stack/router"
import { oauthTokens } from "@test/presets.ts"

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

beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("createAuthClient", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("uses client options", () => {
        createClientMock.mockReturnValue({
            get: vi.fn(),
            post: vi.fn(),
        })

        createAuthClient({ baseURL: "https://example.com" })
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "https://example.com",
            cache: "no-store",
            credentials: "include",
        })
    })

    test("overrides default client options", () => {
        createClientMock.mockReturnValue({
            get: vi.fn(),
            post: vi.fn(),
        })

        createAuthClient({
            baseURL: "/api/auth",
            cache: "reload",
            credentials: "same-origin",
        })
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "/api/auth",
            cache: "reload",
            credentials: "same-origin",
        })
    })

    test("infer baseURL from window.location.origin in browser environment", () => {
        vi.stubGlobal("window", { location: { origin: "https://example.com" } })
        createClientMock.mockReturnValue({
            get: vi.fn(),
            post: vi.fn(),
        })

        createAuthClient({})
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "https://example.com",
            cache: "no-store",
            credentials: "include",
        })
    })

    test("getSession with valid session", async () => {
        const get = vi.fn().mockResolvedValue(
            createJSONResponse({
                success: true,
                session: { user: { id: "user_1" } },
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const session = await client.getSession()

        expect(get).toHaveBeenCalledWith("/session")
        expect(session).toEqual({ user: { id: "user_1" } })
    })

    test("getSession with no session", async () => {
        const get = vi.fn().mockResolvedValue(
            createJSONResponse({
                success: false,
                session: null,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const session = await client.getSession()

        expect(get).toHaveBeenCalledWith("/session")
        expect(session).toBeNull()
    })

    test("getSession with 401 status code", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 401))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        await expect(client.getSession()).resolves.toBeNull()
    })

    test("signIn with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ signInURL: "https://example.com/oauth" }))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })
        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.signIn("github", { redirectTo: "/dashboard" })

        expect(get).toHaveBeenCalledWith("/signIn/:oauth", {
            params: { oauth: "github" },
            searchParams: {
                redirect: false,
                redirectTo: "/dashboard",
            },
        })
        expect(response).toEqual({ signInURL: "https://example.com/oauth" })
    })

    test("signIn with redirect option", async () => {
        vi.stubGlobal("window", { location: { assign: vi.fn() } })
        const get = vi.fn().mockResolvedValue(createJSONResponse({ signInURL: "https://example.com/oauth" }))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })
        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.signIn("github", { redirect: true, redirectTo: "/dashboard" })

        expect(get).toHaveBeenCalledWith("/signIn/:oauth", {
            params: { oauth: "github" },
            searchParams: {
                // The redirect is set to false in the request to prevent automatic
                // redirection by server response by 302 status code.
                redirect: false,
                redirectTo: "/dashboard",
            },
        })
        expect(window.location.assign).toHaveBeenCalledWith("https://example.com/oauth")
        expect(response).toEqual({ signInURL: "https://example.com/oauth" })
    })

    test("signIn with redirect: false does not navigate", async () => {
        vi.stubGlobal("window", { location: { assign: vi.fn() } })

        const get = vi.fn().mockResolvedValue(createJSONResponse({ signInURL: "https://example.com/oauth" }))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })
        const client = createAuthClient({ baseURL: "https://example.com" })
        await client.signIn("github", { redirect: false })

        expect(get).toHaveBeenCalledWith("/signIn/:oauth", {
            params: { oauth: "github" },
            searchParams: {
                // The redirect is set to false in the request to prevent automatic
                // redirection by server response by 302 status code.
                redirect: false,
            },
        })
        expect(window.location.assign).not.toHaveBeenCalled()
    })

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

    test("signInCredentials with redirectTo option", async () => {
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
        expect(response).toEqual({ success: false, redirectURL: null })
    })

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

    test("getProviderTokens with valid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
                tokens: oauthTokens,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.getProviderTokens("github")

        expect(get).toHaveBeenCalledTimes(2)
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(get).toHaveBeenCalledWith("/providers/:oauth/tokens", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual({ success: true, tokens: oauthTokens })
    })

    test("getProviderTokens with invalid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
                tokens: null,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.getProviderTokens("github")

        expect(get).toHaveBeenCalledTimes(2)
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(get).toHaveBeenCalledWith("/providers/:oauth/tokens", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual({ success: false, tokens: null })
    })
})
