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
