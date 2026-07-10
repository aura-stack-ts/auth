import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { discoveryMetadata, normalizeIssuer } from "@/shared/oidc/discovery.ts"
import { openIDMetadata } from "@test/presets.ts"

describe("discoveryMetadata", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test("fetches and validates discovery metadata", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => openIDMetadata,
            }))
        )

        const metadata = await discoveryMetadata("https://id.example.com")
        expect(metadata).toEqual(openIDMetadata)
        expect(fetch).toHaveBeenCalledWith(
            "https://id.example.com/.well-known/openid-configuration",
            expect.objectContaining({
                headers: { Accept: "application/json" },
            })
        )
    })

    test("fetches and validates discovery metadata - issuer with slig", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({ ...openIDMetadata, issuer: "https://app.com/issuer/1/apps/2" }),
            }))
        )

        const metadata = await discoveryMetadata("https://app.com/issuer/1/apps/2")
        expect(metadata).toEqual({ ...openIDMetadata, issuer: "https://app.com/issuer/1/apps/2" })
        expect(fetch).toHaveBeenCalledWith(
            "https://app.com/issuer/1/apps/2/.well-known/openid-configuration",
            expect.objectContaining({
                headers: { Accept: "application/json" },
            })
        )
    })

    test("normalizes trailing slash on issuer comparison", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({ ...openIDMetadata, issuer: "https://id.example.com/" }),
            }))
        )

        const metadata = await discoveryMetadata("https://id.example.com")
        expect(metadata.issuer).toBe("https://id.example.com/")
    })

    test("throws on invalid schema", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({ issuer: "https://id.example.com" }),
            }))
        )

        await expect(discoveryMetadata("https://id.example.com")).rejects.toMatchObject({
            code: "OIDC_DISCOVERY_INVALID_SCHEMA",
        })
    })

    test("throws on issuer mismatch", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({ ...openIDMetadata, issuer: "https://other.example.com" }),
            }))
        )

        await expect(discoveryMetadata("https://id.example.com")).rejects.toMatchObject({
            code: "OIDC_DISCOVERY_ISSUER_MISMATCH",
        })
    })

    test("throws on non-ok response", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: false,
                headers: new Headers({ "Content-Type": "application/json" }),
            }))
        )

        await expect(discoveryMetadata("https://id.example.com")).rejects.toMatchObject({
            code: "OIDC_DISCOVERY_INVALID_RESPONSE",
        })
    })

    test("normalizeIssuer strips trailing slash", () => {
        expect(normalizeIssuer("https://id.example.com/")).toBe("https://id.example.com")
        expect(normalizeIssuer("https://id.example.com")).toBe("https://id.example.com")
    })
})
