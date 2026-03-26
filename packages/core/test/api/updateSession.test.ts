import { api } from "@test/presets.ts"
import { describe, test, expect } from "vitest"

describe("updateSession API", () => {
    test("invalid session", async () => {
        const updated = await api.updateSession({
            headers: new Headers(),
            session: {},
        })
        expect(updated).toEqual({
            session: null,
            headers: expect.any(Headers),
            updated: false,
        })
    })
})
