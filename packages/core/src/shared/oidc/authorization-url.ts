import { createAuthorizationURL } from "@/actions/signIn/authorization-url.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"
import type { GlobalContext } from "@aura-stack/router"

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
