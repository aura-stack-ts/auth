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
