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

test("changeEmail changes email successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changeEmail({
        payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/email/change", {
        body: { currentPassword: "mypassword", newEmail: "new@example.com" },
        searchParams: { redirect: false, redirectTo: undefined },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("changeEmail with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/profile" }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changeEmail({
        payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
        redirectTo: "/profile",
    })

    expect(post).toHaveBeenCalledWith("/email/change", {
        body: { currentPassword: "mypassword", newEmail: "new@example.com" },
        searchParams: { redirect: false, redirectTo: "/profile" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/profile" })
})

test("changeEmail returns failure on wrong password", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 401))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changeEmail({
        payload: { currentPassword: "wrongpass", newEmail: "new@example.com" },
    })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("changeEmail returns failure when CSRF token is missing", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
    const post = vi.fn()

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changeEmail({
        payload: { currentPassword: "mypassword", newEmail: "new@example.com" },
    })

    expect(post).not.toHaveBeenCalled()
    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})
