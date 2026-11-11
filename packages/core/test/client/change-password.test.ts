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

test("changePassword changes password successfully", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: null }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changePassword({
        payload: { currentPassword: "oldpass", newPassword: "newpass" },
    })

    expect(get).toHaveBeenCalledWith("/csrfToken")
    expect(post).toHaveBeenCalledWith("/password/change", {
        body: { currentPassword: "oldpass", newPassword: "newpass" },
        searchParams: { redirect: false, redirectTo: undefined },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: null })
})

test("changePassword with redirectTo option", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: true, redirect: false, redirectURL: "/settings" }))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changePassword({
        payload: { currentPassword: "oldpass", newPassword: "newpass" },
        redirectTo: "/settings",
    })

    expect(post).toHaveBeenCalledWith("/password/change", {
        body: { currentPassword: "oldpass", newPassword: "newpass" },
        searchParams: { redirect: false, redirectTo: "/settings" },
        headers: { "X-CSRF-Token": "csrf_token_1" },
    })
    expect(response).toEqual({ success: true, redirect: false, redirectURL: "/settings" })
})

test("changePassword returns failure on wrong current password", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({ csrfToken: "csrf_token_1" }))
    const post = vi.fn().mockResolvedValue(createJSONResponse({ success: false, redirect: false, redirectURL: null }, 401))

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changePassword({
        payload: { currentPassword: "wrongpass", newPassword: "newpass" },
    })

    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})

test("changePassword returns failure when CSRF token is missing", async () => {
    const get = vi.fn().mockResolvedValue(createJSONResponse({}, 500))
    const post = vi.fn()

    createClientMock.mockReturnValue({ get, post })

    const client = createAuthClient({ baseURL: "https://example.com" })
    const response = await client.changePassword({
        payload: { currentPassword: "oldpass", newPassword: "newpass" },
    })

    expect(post).not.toHaveBeenCalled()
    expect(response).toEqual({ success: false, redirect: false, redirectURL: null })
})
