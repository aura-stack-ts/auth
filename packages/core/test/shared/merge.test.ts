import { merge } from "@/shared/utils.ts"
import { describe, expect, test } from "vitest"

describe("merge", () => {
    test("should merge two objects", () => {
        const origin = {
            a: 1,
            b: {
                c: 2,
            },
        }

        const source = {
            b: {
                d: 3,
            },
            e: 4,
        }

        expect(merge(origin, source)).toEqual({
            a: 1,
            b: {
                c: 2,
                d: 3,
            },
            e: 4,
        })
    })

    test("should overwrite existing properties", () => {
        const origin = {
            a: 1,
            b: {
                c: 2,
            },
        }

        const source = {
            b: {
                c: 3,
            },
            e: 4,
        }

        expect(merge(origin, source)).toEqual({
            a: 1,
            b: {
                c: 3,
            },
            e: 4,
        })
    })

    test("override functions", () => {
        let fn = () => "source"
        let someFn = () => "source"
        const origin = {
            fn: () => "origin",
            someFn: () => "origin",
            value: 42,
        }

        const source = {
            fn,
            someFn,
            extra: "extra",
        }

        expect(merge(origin, source)).toEqual({
            fn,
            someFn,
            value: 42,
            extra: "extra",
        })
    })

    test("override source object", () => {
        const origin = {
            url: "https://origin.com",
            config: {
                timeout: 5000,
            },
        }

        const source = {
            url: {
                href: "https://source.com",
            },
            config: {
                timeout: 10000,
            },
        }

        expect(merge(origin, source)).toEqual({
            url: {
                href: "https://source.com",
            },
            config: {
                timeout: 10000,
            },
        })
    })
})
