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
})
