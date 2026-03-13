import { beforeEach, describe, expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient as createClientAPI } from "@aura-stack/router"

vi.mock("@aura-stack/router", () => ({
    createClient: vi.fn(),
}))

const createClientMock = vi.mocked(createClientAPI)

const createJSONResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    })

describe("createAuthClient", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("uses default client options and default baseURL", () => {
        createClientMock.mockReturnValue({
            get: vi.fn(),
            post: vi.fn(),
        } as never)

        createAuthClient({} as never)

        expect(createClientMock).toHaveBeenCalledWith({
            cache: "no-store",
            credentials: "include",
            baseURL: "/",
        })
    })

    test("allows custom options to override defaults", () => {
        createClientMock.mockReturnValue({
            get: vi.fn(),
            post: vi.fn(),
        } as never)

        createAuthClient({
            baseURL: "/api/auth",
            cache: "reload",
            credentials: "same-origin",
        } as never)

        expect(createClientMock).toHaveBeenCalledWith({
            cache: "reload",
            credentials: "same-origin",
            baseURL: "/api/auth",
        })
    })

    test("getSession returns parsed session when authenticated", async () => {
        const get = vi.fn().mockResolvedValue(
            createJSONResponse({
                authenticated: true,
                session: { user: { id: "user_1" } },
            })
        )

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        } as never)

        const client = createAuthClient({} as never)
        const session = await client.getSession()

        expect(get).toHaveBeenCalledWith("/session")
        expect(session).toEqual({ user: { id: "user_1" } })
    })

    test("getSession returns null for non-ok response", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 401))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        } as never)

        const client = createAuthClient({} as never)

        await expect(client.getSession()).resolves.toBeNull()
    })

    test("signIn calls endpoint with oauth and redirectTo", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ url: "https://example.com/oauth" }))

        createClientMock.mockReturnValue({
            get,
            post: vi.fn(),
        } as never)

        const client = createAuthClient({} as never)
        const result = await client.signIn("github", { redirectTo: "/dashboard" })

        expect(get).toHaveBeenCalledWith("/signIn/:oauth", {
            params: { oauth: "github" },
            searchParams: { redirectTo: "/dashboard" },
        })
        expect(result).toEqual({ url: "https://example.com/oauth" })
    })

    test("signOut includes csrf token in headers", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ message: "Signed out successfully" }, 202))

        createClientMock.mockReturnValue({
            get,
            post,
        } as never)

        const client = createAuthClient({} as never)
        const result = await client.signOut({ redirectTo: "/logout" })

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
        expect(result).toEqual({ message: "Signed out successfully" })
    })

    test("signOut returns failure message when csrf token fetch fails", async () => {
        const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
        const post = vi.fn()

        createClientMock.mockReturnValue({
            get,
            post,
        } as never)

        const client = createAuthClient({} as never)
        const result = await client.signOut()

        expect(post).not.toHaveBeenCalled()
        expect(result).toEqual({ message: "Failed to sign out." })
    })
})