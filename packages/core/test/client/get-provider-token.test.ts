import { expect, test, vi } from "vitest"
import { createAuthClient } from "@/client/client.ts"
import { createClient } from "@aura-stack/router"
import { oauthTokens } from "@test/setup/presets.ts"

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
