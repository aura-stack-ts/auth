import { describe, test, expect } from "vitest"
import { createContext } from "@/config/context.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"

describe("getRedirectResponse", () => {
    const ctx = createContext({})

    test("redirect: false and redirectTo: /", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "/dashboard", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("redirect: true and redirectTo: /", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: true, redirectTo: "/", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: true,
            redirectURL: null,
            status: 302,
        })
        expect(Object.fromEntries(headers)).toEqual({
            location: "/",
        })
    })

    test("redirect: true and redirectTo: undefined", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: true, redirectTo: undefined, fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: null,
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("redirect: true and redirectTo in same origin", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: true, redirectTo: "/dashboard", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: true,
            redirectURL: null,
            status: 302,
        })
        expect(Object.fromEntries(headers)).toEqual({
            location: "/dashboard",
        })
    })

    test("redirect: false and redirectTo in same origin", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "/dashboard", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("redirect: true and redirectTo in same origin and cutting origin", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: true, redirectTo: "https://app.com/admin/dashboard", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: true,
            redirectURL: null,
            status: 302,
        })
        expect(Object.fromEntries(headers)).toEqual({
            location: "/admin/dashboard",
        })
    })

    test("redirect: false and redirectTo in same origin and cutting origin", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "https://app.com/admin/dashboard", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/admin/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("redirect: true and redirectTo with untrusted redirectTo", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: true, redirectTo: "https://devil.com/admin", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: true,
            redirectURL: null,
            status: 302,
        })
        expect(Object.fromEntries(headers)).toEqual({
            location: "/",
        })
    })

    test("redirect: false and redirectTo with untrusted redirectTo", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "https://devil.com/admin", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("uses a global validated fallback when redirectTo is untrusted", async () => {
        const headers = new Headers()
        const ctx = createContext({ fallbackRedirectTo: "/dashboard" })

        expect(
            await getRedirectResponse({
                context: {
                    ctx,
                    redirect: false,
                    redirectTo: "https://devil.com/admin",
                    fallbackRedirectTo: undefined,
                },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("rejects an untrusted global fallback redirectTo", async () => {
        const headers = new Headers()
        const ctx = createContext({ fallbackRedirectTo: "https://superdevil.com/admin/dashboard" })

        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "https://devil.com/admin", fallbackRedirectTo: undefined },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("uses a validated fallback when redirectTo is untrusted", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: { ctx, redirect: false, redirectTo: "https://devil.com/admin", fallbackRedirectTo: "/dashboard" },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("rejects an untrusted fallback redirectTo", async () => {
        const headers = new Headers()
        expect(
            await getRedirectResponse({
                context: {
                    ctx,
                    redirect: false,
                    redirectTo: "https://devil.com/admin",
                    fallbackRedirectTo: "https://superdevil.com/admin/dashboard",
                },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("uses a validated fallback when redirectTo and global fallback are untrusted", async () => {
        const headers = new Headers()
        const ctx = createContext({ fallbackRedirectTo: "https://superdevil.com/admin" })

        expect(
            await getRedirectResponse({
                context: {
                    ctx,
                    redirect: false,
                    redirectTo: "https://devil.com/admin",
                    fallbackRedirectTo: "/dashboard",
                },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("uses a validated fallback when redirectTo is untrusted", async () => {
        const headers = new Headers()
        const ctx = createContext({ fallbackRedirectTo: "/dashboard" })

        expect(
            await getRedirectResponse({
                context: {
                    ctx,
                    redirect: false,
                    redirectTo: "https://devil.com/admin",
                    fallbackRedirectTo: "https://superdevi.com/admin/dashboard",
                },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/dashboard",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })

    test("rejects all untrusted fallback redirectTo", async () => {
        const headers = new Headers()
        const ctx = createContext({ fallbackRedirectTo: "https://superdevil.com/admin" })

        expect(
            await getRedirectResponse({
                context: {
                    ctx,
                    redirect: false,
                    redirectTo: "https://devil.com/admin",
                    fallbackRedirectTo: "https://hyperdevil.com/admin",
                },
                headers,
                request: new Request("https://app.com"),
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })
})
