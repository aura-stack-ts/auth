import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { validateIDToken } from "@/actions/oidc/id-token.ts"
import { clearJWKSCache } from "@/actions/oidc/jwks.ts"
import { RS256PEMFormat } from "@test/presets.ts"
import { SignJWT, exportJWK, importPKCS8, importSPKI } from "@aura-stack/jose/jose"

const ISSUER = "https://id.example.com"
const CLIENT_ID = "oidc_client_id"
const JWKS_URI = "https://id.example.com/oauth/jwks"
const NONCE = "test-nonce-value"

const createSignedIDToken = async (claims: Record<string, unknown> = {}) => {
    const privateKey = await importPKCS8(RS256PEMFormat.privateKey, "RS256")
    const now = Math.floor(Date.now() / 1000)
    return await new SignJWT({
        sub: "user-123",
        nonce: NONCE,
        ...claims,
    })
        .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
        .setIssuer(ISSUER)
        .setAudience(CLIENT_ID)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(privateKey)
}

const mockJWKSFetch = async () => {
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
}

describe("validateIDToken", () => {
    beforeEach(() => {
        clearJWKSCache()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test("validates a signed id_token with matching nonce", async () => {
        await mockJWKSFetch()
        const idToken = await createSignedIDToken()

        await expect(
            validateIDToken(idToken, {
                issuer: ISSUER,
                clientId: CLIENT_ID,
                nonce: NONCE,
                jwks_uri: JWKS_URI,
            })
        ).resolves.toBeUndefined()
    })

    test("throws on nonce mismatch", async () => {
        await mockJWKSFetch()
        const idToken = await createSignedIDToken()

        await expect(
            validateIDToken(idToken, {
                issuer: ISSUER,
                clientId: CLIENT_ID,
                nonce: "wrong-nonce",
                jwks_uri: JWKS_URI,
            })
        ).rejects.toMatchObject({ code: "OIDC_NONCE_MISMATCH" })
    })

    test("throws on invalid signature", async () => {
        await mockJWKSFetch()
        const idToken = (await createSignedIDToken()) + "tampered"

        await expect(
            validateIDToken(idToken, {
                issuer: ISSUER,
                clientId: CLIENT_ID,
                nonce: NONCE,
                jwks_uri: JWKS_URI,
            })
        ).rejects.toMatchObject({ code: "JWT_INVALID_SIGNATURE" })
    })
})
