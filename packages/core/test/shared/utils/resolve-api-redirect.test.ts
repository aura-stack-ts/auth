import { resolveApiRedirect } from "@/shared/utils/api.ts"
import type { GlobalContext } from "@aura-stack/router/types"
import { describe, test, expect } from "vitest"

describe("resolveApiRedirect", () => {
    test("redirect: true and redirectTo: undefined", async () => {
        expect(
            await resolveApiRedirect({} as GlobalContext, new Request("https://app.com"), true, undefined, new Headers())
        ).toEqual({
            redirect: false,
            redirectURL: null,
            status: 200,
        })
    })
    test("redirect: true and redirectTo in same origin", async () => {
        const headers = new Headers()
        expect(
            await resolveApiRedirect({} as GlobalContext, new Request("https://app.com"), true, "/dashboard", headers)
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
            await resolveApiRedirect({} as GlobalContext, new Request("https://app.com"), false, "/dashboard", headers)
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
            await resolveApiRedirect(
                {} as GlobalContext,
                new Request("https://app.com"),
                true,
                "https://app.com/admin/dashboard",
                headers
            )
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
            await resolveApiRedirect(
                {} as GlobalContext,
                new Request("https://app.com"),
                false,
                "https://app.com/admin/dashboard",
                headers
            )
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
            await resolveApiRedirect(
                {} as GlobalContext,
                new Request("https://app.com"),
                true,
                "https://devil.com/admin",
                headers
            )
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
            await resolveApiRedirect(
                {} as GlobalContext,
                new Request("https://app.com"),
                false,
                "https://devil.com/admin",
                headers
            )
        ).toEqual({
            redirect: false,
            redirectURL: "/",
            status: 200,
        })
        expect(Object.fromEntries(headers)).not.haveOwnProperty("location")
    })
})
