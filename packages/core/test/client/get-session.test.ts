import { expect, test, vi } from "vitest"
import { createClient } from "@aura-stack/router"
import { createAuthClient } from "@/client/client.ts"

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

test("getSession with valid session", async () => {
    const get = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: true,
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

test("getSession with no session", async () => {
    const get = vi.fn().mockResolvedValue(
        createJSONResponse({
            success: false,
            session: null,
        })
    )

    createClientMock.mockReturnValue({
        get,
        post: vi.fn(),
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const session = await client.getSession()

    expect(get).toHaveBeenCalledWith("/session")
    expect(session).toBeNull()
})

test("getSession with 401 status code", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 401))

    createClientMock.mockReturnValue({
        get,
        post: vi.fn(),
    })

    const client = createAuthClient({ baseURL: "https://example.com" })
    await expect(client.getSession()).resolves.toBeNull()
})
