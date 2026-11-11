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
