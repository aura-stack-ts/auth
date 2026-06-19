import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import {
    resolveOpenIDProvider,
    createOpenIDPlaceholder,
    clearResolvedProviderCache,
    isOIDCProvider,
} from "@/actions/oidc/resolve-provider.ts"
import { openIDCustomProvider, openIDMetadata } from "@test/presets.ts"

describe("resolveOpenIDProvider", () => {
    beforeEach(() => {
        clearResolvedProviderCache()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test("maps discovery metadata to OAuth provider shape", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                headers: new Headers({ "Content-Type": "application/json" }),
                json: async () => openIDMetadata,
            }))
        )

        const placeholder = createOpenIDPlaceholder(openIDCustomProvider, {
            clientId: openIDCustomProvider.clientId!,
            clientSecret: openIDCustomProvider.clientSecret!,
        })

        const resolved = await resolveOpenIDProvider(placeholder)

        expect(resolved.authorize).toEqual({
            url: openIDMetadata.authorization_endpoint,
            params: { responseType: "code", scope: "openid profile email" },
        })
        expect(resolved.accessToken).toBe(openIDMetadata.token_endpoint)
        expect(resolved.userInfo).toBe(openIDMetadata.userinfo_endpoint)
        expect(resolved.oidc).toEqual({
            issuer: openIDMetadata.issuer,
            jwks_uri: openIDMetadata.jwks_uri,
        })
    })

    test("caches resolved provider", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => openIDMetadata,
        }))
        vi.stubGlobal("fetch", fetchMock)

        const placeholder = createOpenIDPlaceholder(openIDCustomProvider, {
            clientId: openIDCustomProvider.clientId!,
            clientSecret: openIDCustomProvider.clientSecret!,
        })

        await resolveOpenIDProvider(placeholder)
        await resolveOpenIDProvider(placeholder)

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test("isOIDCProvider detects oidc context", () => {
        expect(isOIDCProvider({ oidc: { issuer: "https://id.example.com" } })).toBe(true)
        expect(isOIDCProvider({})).toBe(false)
    })
})
