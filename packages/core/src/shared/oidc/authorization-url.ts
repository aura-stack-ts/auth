import { createSecretValue } from "@/shared/crypto.ts"
import { createAuthorizationURL } from "@/shared/utils/authorization.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { RuntimeOAuthProvider } from "@/@types/internal.ts"

export const createOIDCAuthorizationURL = async (oauth: RuntimeOAuthProvider, redirectURI: string, ctx?: GlobalContext) => {
    const nonce = createSecretValue()
    const authorizeConfig = oauth.authorize
    const oauthWithNonce: RuntimeOAuthProvider = {
        ...oauth,
        authorize:
            typeof authorizeConfig === "string"
                ? { url: authorizeConfig, params: { nonce } }
                : {
                      url: authorizeConfig.url,
                      params: { ...authorizeConfig.params, nonce },
                  },
    }

    const result = await createAuthorizationURL(oauthWithNonce, redirectURI, ctx)
    return { ...result, nonce }
}
