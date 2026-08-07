import { beforeEach, vi } from "vitest"
import type { AuthInstance } from "@aura-stack/auth"

const mocks = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
    mockGetRequestHeaders: vi.fn(),
}))

// @ts-ignore
export const mockGetRequest = mocks.mockGetRequest
// @ts-ignore
export const mockGetRequestHeaders = mocks.mockGetRequestHeaders

vi.mock("@tanstack/react-start", () => {
    const createServerFn = () => {
        const builder = {
            validator: () => builder,
            handler: (handler: (...args: any[]) => any) => {
                const serverFn = Object.assign(async (...args: any[]) => handler(...args), {
                    __executeServer: async (...args: any[]) => handler(...args),
                })
                return serverFn
            },
        }

        return builder
    }

    return { createServerFn }
})

vi.mock("@tanstack/react-start/server", () => ({
    getRequestHeaders: () => mocks.mockGetRequestHeaders(),
    getRequest: () => mocks.mockGetRequest(),
}))

export const authInstance = (apiOverrides: Partial<AuthInstance["api"]> = {}): AuthInstance => {
    return {
        api: {
            getSession: vi.fn().mockResolvedValue({ success: false, session: null, headers: new Headers(), toResponse: vi.fn() }),
            signIn: vi.fn().mockResolvedValue({ success: false, signInURL: null, headers: new Headers(), toResponse: vi.fn() }),
            signInCredentials: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            updateSession: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                redirectURL: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            signOut: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            signUp: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            getProviderTokens: vi.fn().mockResolvedValue({
                success: false,
                tokens: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            getAccessToken: vi.fn().mockResolvedValue({
                success: false,
                accessToken: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            refreshUserInfo: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            revokeToken: vi.fn().mockResolvedValue({
                success: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            disconnectProvider: vi.fn().mockResolvedValue({
                success: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            isProviderConnected: vi.fn().mockResolvedValue({
                success: false,
                connected: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
            ...apiOverrides,
        },
    } as unknown as AuthInstance
}

export const beforeEachSetup = () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetRequestHeaders.mockReturnValue(new Headers())
        mockGetRequest.mockReturnValue(new Request("http://localhost"))
    })
}
