import { toUnionHeaders } from "@/shared/http/headers.ts"
import { describe, test, expect } from "vitest"

describe("toUnionHeaders", () => {
    test("union two headers", () => {
        expect(
            Object.fromEntries(
                toUnionHeaders(new Headers({ "Content-Type": "application/json" }), { Accept: "application/json" })
            )
        ).toEqual({
            accept: "application/json",
            "content-type": "application/json",
        })
    })

    test("prioritize existing values for duplicate headers", () => {
        expect(
            Object.fromEntries(
                toUnionHeaders(new Headers({ Cookie: "session=original", "Content-Type": "text/plain" }), {
                    Cookie: "session=replacement",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                })
            )
        ).toEqual({
            cookie: "session=original",
            accept: "application/json",
            "content-type": "text/plain",
        })
    })

    test("append all incoming Set-Cookie headers to existing cookies", () => {
        const init = new Headers()
        init.append("Set-Cookie", "session=first; Path=/")

        const headers = new Headers()
        headers.append("Set-Cookie", "state=second; Path=/")
        headers.append("Set-Cookie", "csrf=third; Path=/")

        expect(toUnionHeaders(init, headers).getSetCookie()).toEqual([
            "session=first; Path=/",
            "state=second; Path=/",
            "csrf=third; Path=/",
        ])
    })
})
