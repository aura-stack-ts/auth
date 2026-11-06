import { beforeEach, describe, expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient } from "@aura-stack/router"
import { oauthTokens, sessionPayload } from "@test/setup/presets.ts"

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

    test("getAccessToken with valid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
                tokens: {
                    accessToken: "brand-new-refreshed-token",
                },
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.getAccessToken("github")

        expect(get).toHaveBeenCalledTimes(2)
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(get).toHaveBeenCalledWith("/providers/:oauth/tokens", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual("brand-new-refreshed-token")
    })

    test("getAccessToken with invalid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
                accessToken: null,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.getAccessToken("github")

        expect(get).toHaveBeenCalledTimes(2)
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(get).toHaveBeenCalledWith("/providers/:oauth/tokens", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(null)
    })

    test("refreshUserInfo with valid response", async () => {
        const get = vi.fn()
        const post = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        post.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
                session: sessionPayload,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.refreshUserInfo("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledWith("/providers/:oauth/user/refresh", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(sessionPayload)
    })

    test("refreshUserInfo with invalid response", async () => {
        const get = vi.fn()
        const post = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        post.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
                session: null,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.refreshUserInfo("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledWith("/providers/:oauth/user/refresh", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(null)
    })

    test("revokeToken with valid response", async () => {
        const get = vi.fn()
        const post = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        post.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.revokeToken("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledOnce()
        expect(post).toHaveBeenCalledWith("/providers/:oauth/tokens/revoke", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(true)
    })

    test("revokeToken with invalid response", async () => {
        const get = vi.fn()
        const post = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        post.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.revokeToken("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledOnce()
        expect(post).toHaveBeenCalledWith("/providers/:oauth/tokens/revoke", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(false)
    })

    test("disconnectProvider with valid response", async () => {
        const get = vi.fn()
        const mockDelete = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        mockDelete.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
            })
        )

        createClientMock.mockReturnValue({
            get,
            delete: mockDelete,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.disconnectProvider("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(mockDelete).toHaveBeenCalledOnce()
        expect(mockDelete).toHaveBeenCalledWith("/providers/:oauth", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(true)
    })

    test("disconnectProvider with invalid response", async () => {
        const get = vi.fn()
        const mockDelete = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))

        mockDelete.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
            })
        )

        createClientMock.mockReturnValue({
            get,
            delete: mockDelete,
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.disconnectProvider("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(mockDelete).toHaveBeenCalledOnce()
        expect(mockDelete).toHaveBeenCalledWith("/providers/:oauth", {
            params: { oauth: "github" },
            headers: {
                "X-CSRF-Token": "csrf_token_1",
            },
        })
        expect(response).toEqual(false)
    })

    test("isProviderConnected with valid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: true,
                connected: true,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.isProviderConnected("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/providers/:oauth", {
            params: { oauth: "github" },
        })
        expect(response).toEqual(true)
    })

    test("isProviderConnected with invalid response", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(
            createJSONResponse({
                success: false,
                connected: false,
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.isProviderConnected("github")

        expect(get).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith("/providers/:oauth", {
            params: { oauth: "github" },
        })
        expect(response).toEqual(false)
    })

    test("set baseURL from BASE_URL environment variable", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        createAuthClient({})
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "https://example.com",
            cache: "no-store",
            credentials: "include",
        })
    })

    test("set baseURL from options when BASE_URL environment variable is not set and options are provided", async () => {
        vi.stubEnv("BASE_URL", "")

        createAuthClient({
            baseURL: "https://example.com",
        })
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "https://example.com",
            cache: "no-store",
            credentials: "include",
        })
    })

    test("set baseURL from window.location.origin when BASE_URL environment variable is not set and options are not provided", async () => {
        vi.stubEnv("BASE_URL", "")
        vi.stubGlobal("window", { location: { origin: "https://example.com" } })

        createAuthClient({})
        expect(createClientMock).toHaveBeenCalledWith({
            baseURL: "https://example.com",
            cache: "no-store",
            credentials: "include",
        })
    })

    test("throws error when BASE_URL environment variable is not set, options are not provided, and window.location.origin is not available", async () => {
        vi.stubEnv("BASE_URL", "")
        vi.stubGlobal("window", undefined)

        expect(() => createAuthClient({})).toThrow()
    })

    // -------------------------------------------------------------------------
    // sendVerificationEmail
    // -------------------------------------------------------------------------

    test("sendVerificationEmail sends email successfully", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.sendVerificationEmail("user@example.com")

        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledWith("/emailVerification/send", {
            body: { email: "user@example.com" },
            searchParams: { redirect: false, redirectTo: undefined },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
    })

    test("sendVerificationEmail with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi
            .fn()
            .mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/verify-sent" }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.sendVerificationEmail("user@example.com", { redirectTo: "/verify-sent" })

        expect(post).toHaveBeenCalledWith("/emailVerification/send", {
            body: { email: "user@example.com" },
            searchParams: { redirect: false, redirectTo: "/verify-sent" },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/verify-sent" })
    })

    test("sendVerificationEmail returns failure on error", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockRejectedValue(new Error("Network error"))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.sendVerificationEmail("user@example.com")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    test("sendVerificationEmail returns failure when CSRF token is missing", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
        const post = vi.fn()

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.sendVerificationEmail("user@example.com")

        expect(post).not.toHaveBeenCalled()
        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // verifyEmail
    // -------------------------------------------------------------------------

    test("verifyEmail verifies token successfully", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyEmail("verify-token-123")

        expect(get).toHaveBeenCalledWith("/emailVerification/verify", {
            searchParams: { token: "verify-token-123", redirect: false, redirectTo: undefined },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
    })

    test("verifyEmail with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/verified" }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyEmail("verify-token-123", { redirectTo: "/verified" })

        expect(get).toHaveBeenCalledWith("/emailVerification/verify", {
            searchParams: { token: "verify-token-123", redirect: false, redirectTo: "/verified" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/verified" })
    })

    test("verifyEmail returns failure on invalid token", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 422))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyEmail("invalid-token")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    test("verifyEmail returns failure on network error", async () => {
        const get = vi.fn().mockRejectedValue(new Error("Network error"))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyEmail("verify-token-123")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // forgotPassword
    // -------------------------------------------------------------------------

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

    test("forgotPassword with redirectTo option", async () => {
        const post = vi
            .fn()
            .mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))

        createClientMock.mockReturnValue({ get: vi.fn(), post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.forgotPassword("user@example.com", { redirectTo: "/check-email" })

        expect(post).toHaveBeenCalledWith("/password/forgot", {
            body: { email: "user@example.com" },
            searchParams: { redirect: false, redirectTo: "/check-email" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
    })

    test("forgotPassword returns failure on network error", async () => {
        const post = vi.fn().mockRejectedValue(new Error("Network error"))

        createClientMock.mockReturnValue({ get: vi.fn(), post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.forgotPassword("user@example.com")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // resetPassword
    // -------------------------------------------------------------------------

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

    test("resetPassword with redirectTo option", async () => {
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

    // -------------------------------------------------------------------------
    // changePassword
    // -------------------------------------------------------------------------

    test("changePassword changes password successfully", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changePassword({
            payload: { currentPassword: "oldpass", newPassword: "newpass" },
        })

        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledWith("/password/change", {
            body: { currentPassword: "oldpass", newPassword: "newpass" },
            searchParams: { redirect: false, redirectTo: undefined },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
    })

    test("changePassword with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/settings" }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changePassword({
            payload: { currentPassword: "oldpass", newPassword: "newpass" },
            redirectTo: "/settings",
        })

        expect(post).toHaveBeenCalledWith("/password/change", {
            body: { currentPassword: "oldpass", newPassword: "newpass" },
            searchParams: { redirect: false, redirectTo: "/settings" },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/settings" })
    })

    test("changePassword returns failure on wrong current password", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 401))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changePassword({
            payload: { currentPassword: "wrongpass", newPassword: "newpass" },
        })

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    test("changePassword returns failure when CSRF token is missing", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
        const post = vi.fn()

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changePassword({
            payload: { currentPassword: "oldpass", newPassword: "newpass" },
        })

        expect(post).not.toHaveBeenCalled()
        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // changeEmail
    // -------------------------------------------------------------------------

    test("changeEmail changes email successfully", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changeEmail({
            payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
        })

        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(post).toHaveBeenCalledWith("/email/change", {
            body: { currentPassword: "mypassword", newEmail: "new@example.com" },
            searchParams: { redirect: false, redirectTo: undefined },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
    })

    test("changeEmail with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/profile" }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changeEmail({
            payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
            redirectTo: "/profile",
        })

        expect(post).toHaveBeenCalledWith("/email/change", {
            body: { currentPassword: "mypassword", newEmail: "new@example.com" },
            searchParams: { redirect: false, redirectTo: "/profile" },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/profile" })
    })

    test("changeEmail returns failure on wrong password", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 401))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changeEmail({
            payload: { currentPassword: "wrongpass", newEmail: "new@example.com" },
        })

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    test("changeEmail returns failure when CSRF token is missing", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
        const post = vi.fn()

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.changeEmail({
            payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
        })

        expect(post).not.toHaveBeenCalled()
        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // verifyEmailChange
    // -------------------------------------------------------------------------

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

    test("verifyEmailChange with redirectTo option", async () => {
        const get = vi
            .fn()
            .mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/email-updated" }))

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

    // -------------------------------------------------------------------------
    // cancelEmailChange
    // -------------------------------------------------------------------------

    test("cancelEmailChange cancels via token", async () => {
        const get = vi.fn()

        // first call: CSRF token, second call: the actual request
        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))
        get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.cancelEmailChange({ payload: { token: "cancel-token-abc" } })

        expect(get).toHaveBeenCalledWith("/csrfToken")
        expect(get).toHaveBeenCalledWith("/email/change/cancel", {
            searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: undefined },
            headers: { "X-CSRF-Token": "csrf_token_1" },
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

    test("cancelEmailChange with redirectTo option", async () => {
        const get = vi.fn()

        get.mockResolvedValueOnce(createJSONResponse({ csrfToken: "csrf_token_1" }))
        get.mockResolvedValueOnce(createJSONResponse({ success: true, redirect: false, redirectURL: "/settings" }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.cancelEmailChange({
            payload: { token: "cancel-token-abc" },
            redirectTo: "/settings",
        })

        expect(get).toHaveBeenCalledWith("/email/change/cancel", {
            searchParams: { token: "cancel-token-abc", redirect: false, redirectTo: "/settings" },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/settings" })
    })

    test("cancelEmailChange returns failure when CSRF token is missing", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.cancelEmailChange({ payload: { token: "cancel-token-abc" } })

        // only /csrfToken was called, the cancel endpoint was not reached
        expect(get).toHaveBeenCalledTimes(1)
        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    // -------------------------------------------------------------------------
    // sendMagicLink
    // -------------------------------------------------------------------------

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

    test("sendMagicLink with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi
            .fn()
            .mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/check-email" }))

        createClientMock.mockReturnValue({ get, post })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.sendMagicLink("john@example.com", { redirectTo: "/check-email" })

        expect(post).toHaveBeenCalledWith("/signIn/magicLink", {
            body: { email: "john@example.com" },
            searchParams: { redirect: false, redirectTo: "/check-email" },
            headers: { "X-CSRF-Token": "csrf_token_1" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/check-email" })
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

    // -------------------------------------------------------------------------
    // verifyMagicLink
    // -------------------------------------------------------------------------

    test("verifyMagicLink verifies token successfully", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyMagicLink("magic-token-xyz")

        expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
            searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: undefined },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
    })

    test("verifyMagicLink with redirectTo option", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/dashboard" }))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyMagicLink("magic-token-xyz", { redirectTo: "/dashboard" })

        expect(get).toHaveBeenCalledWith("/signIn/magicLink/verify", {
            searchParams: { token: "magic-token-xyz", redirect: false, redirectTo: "/dashboard" },
        })
        expect(response).toEqual({ success: true, redirect: false, redirectURL: "/dashboard" })
    })

    test("verifyMagicLink returns failure on invalid token", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 422))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyMagicLink("invalid-token")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })

    test("verifyMagicLink returns failure on network error", async () => {
        const get = vi.fn().mockRejectedValue(new Error("Network error"))

        createClientMock.mockReturnValue({ get, post: vi.fn() })

        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.verifyMagicLink("magic-token-xyz")

        expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
    })
})
