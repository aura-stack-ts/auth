import { beforeEach, describe, expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient } from "@aura-stack/router"

vi.mock("@aura-stack/router", () => ({
    createClient: vi.fn(),
}))

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

    test("getSession returns valid session", async () => {
        const get = vi.fn().mockResolvedValue(
            createJSONResponse({
                authenticated: true,
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

    test("getSession returns null for non-ok response", async () => {
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
        const get = vi.fn().mockResolvedValue(createJSONResponse({ signInURL: "https://example.com/oauth" }))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        })
        const client = createAuthClient({ baseURL: "https://example.com" })
        const response = await client.signIn("github", { redirect: false, redirectTo: "/dashboard" })

        expect(get).toHaveBeenCalledWith("/signIn/:oauth", {
            params: { oauth: "github" },
            searchParams: {
                redirect: false,
                redirectTo: "/dashboard",
            },
        })
        expect(response).toEqual({ signInURL: "https://example.com/oauth" })
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
        await expect(client.signOut()).rejects.toThrow()
        expect(post).not.toHaveBeenCalled()
    })
})
