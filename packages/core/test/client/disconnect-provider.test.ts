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
