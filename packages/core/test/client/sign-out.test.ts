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
