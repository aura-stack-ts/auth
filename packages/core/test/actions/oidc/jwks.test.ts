import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { fetchJWKS, clearJWKSCache } from "@/shared/oidc/jwks.ts"
import { RS256PEMFormat } from "@test/presets.ts"
import { exportJWK, importSPKI } from "@aura-stack/jose/jose"

describe("fetchJWKS", () => {
    beforeEach(() => {
        clearJWKSCache()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test("validates JWKS response schema", async () => {
        const publicKey = await importSPKI(RS256PEMFormat.publicKey, "RS256")
        const jwk = await exportJWK(publicKey)

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({ keys: [{ ...jwk, kid: "test-kid", use: "sig", alg: "RS256" }] }),
            }))
        )

        await fetchJWKS("https://id.example.com/oauth/jwks")
        expect(fetch).toHaveBeenCalledWith(
            "https://id.example.com/oauth/jwks",
            expect.objectContaining({ headers: { Accept: "application/json" } })
        )
    })

    test("throws on invalid JWKS schema", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => ({}),
            }))
        )

        await expect(fetchJWKS("https://id.example.com/oauth/jwks")).rejects.toMatchObject({
            code: "OIDC_JWKS_INVALID_SCHEMA",
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

        await expect(fetchJWKS("https://id.example.com/oauth/jwks")).rejects.toMatchObject({
            code: "OIDC_JWKS_INVALID_RESPONSE",
        })
    })
})
