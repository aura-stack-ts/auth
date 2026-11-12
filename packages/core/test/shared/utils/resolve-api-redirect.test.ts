import { describe, test, expect } from "vitest"
import { resolveApiRedirect } from "@/shared/utils/api.ts"
import type { GlobalContext } from "@aura-stack/router/types"

describe("resolveApiRedirect", () => {
    test("redirect: false and redirectTo: /", async () => {
        const headers = new Headers()
        expect(
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: true,
                redirectTo: "/",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: true,
                redirectTo: undefined,
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: true,
                redirectTo: "/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: true,
                redirectTo: "https://app.com/admin/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://app.com/admin/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: true,
                redirectTo: "https://devil.com/admin",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
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
        expect(
            await resolveApiRedirect({
                ctx: { fallbackRedirectTo: "/dashboard" } as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
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
        expect(
            await resolveApiRedirect({
                ctx: { fallbackRedirectTo: "https://superdevil.com/admin/dashboard" } as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
                fallbackRedirectTo: "/dashboard",
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
            await resolveApiRedirect({
                ctx: {} as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
                fallbackRedirectTo: "https://superdevil.com/admin/dashboard",
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
        expect(
            await resolveApiRedirect({
                ctx: { fallbackRedirectTo: "https://superdevil.com/admin" } as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
                fallbackRedirectTo: "/dashboard",
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
        expect(
            await resolveApiRedirect({
                ctx: { fallbackRedirectTo: "/dashboard" } as GlobalContext,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
                fallbackRedirectTo: "https://superdevi.com/admin/dashboard",
                headers,
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
        expect(
            await resolveApiRedirect({
                ctx: { fallbackRedirectTo: "https://superdevil.com/admin" } as GlobalContext,
                headers,
                request: new Request("https://app.com"),
                redirectInit: false,
                redirectTo: "https://devil.com/admin",
                fallbackRedirectTo: "https://hyperdevil.com/admin",
            })
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })
})
