import { beforeEach, describe, expect, test, vi } from "vitest"
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

    test("set custom redirect callback", async () => {
        vi.stubGlobal("window", { location: { assign: vi.fn() } })

        const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
        const post = vi.fn().mockResolvedValue(createJSONResponse({ redirect: true, redirectURL: "/logout" }, 202))

        createClientMock.mockReturnValue({
            get,
            post,
        })

        const redirectCallback = vi.fn()

        const client = createAuthClient({
            redirect: redirectCallback,
            baseURL: "http://locahost:1000",
        })

        await client.signOut({
            redirect: true,
            redirectTo: "/logout",
        })

        expect(window.location.assign).not.toHaveBeenCalled()
        expect(redirectCallback).toHaveBeenCalledWith("/logout")
    })
})
