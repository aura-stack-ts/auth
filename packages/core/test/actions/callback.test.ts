import { describe, test, expect, vi, beforeEach } from "vitest"
import { callbackAction } from "@/actions/callback/callback.js"
import { createOAuthIntegrations } from "@/oauth/index.js"

describe("callbackAction", () => {
    test("skip", () => {
        expect(true).toBe(true)
    })
})
