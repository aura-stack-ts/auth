import type { User } from "@/@types/session.ts"
import type { GetRouteParams } from "@aura-stack/router/types"
import type { RevokeTokenParams, RevokeTokenTokenHint } from "./oauth.ts"

/**
 * @link https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
export interface OpenIDMetadata {
    /**
     * URL using the https scheme with no query or fragment component that the
     * OP asserts as its Issuer Identifier.
     */
    issuer: string
    /**
     * URL of the OP's OAuth 2.0 Authorization Endpoint
     */
    authorization_endpoint: string
    /**
     * URL of the OP's OAuth 2.0 Token Endpoint
     */
    token_endpoint: string
    /**
     * URL of the OP's UserInfo Endpoint.
     */
    userinfo_endpoint: string
    /**
     * URL of the OP's JSON Web Key Set [JWK] document. This contains the signing keys
     * used by the OP to sign tokens issued, which may be used by the RP to validate
     * signatures.
     */
    jwks_uri: string
    /**
     * URL of the OP's Dynamic Client Registration Endpoint. This is REQUIRED unless
     * the OP does not support dynamic client registration, in which case it MUST NOT
     * be included.
     */
    registration_endpoint?: string
    /**
     * JSON arry containing a list of the OP's supported Subject Identifier types.
     * Valid types include pairwise and public.
     */
    scopes_supported?: string[]
    /**
     * Json array containing a list of the OP's supported response types. Valid response
     * types include code, id_token, and token. The OP MUST support the code response type.
     */
    response_types_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported response modes. Valid response
     * modes include query, fragment, and form_post. If omitted, the default is that the
     * OP supports only the query response mode.
     */
    response_modes_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported grant types. Valid grant types
     * include authorization_code, implicit, refresh_token, and client_credentials.
     * If omitted, the default is that the OP supports only the authorization_code
     * grant type.
     */
    grant_types_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported ACR values. If omitted, the
     * default is that the OP does not support any ACR values.
     */
    acr_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Subject Identifier types.
     * Valid types include pairwise and public.
     */
    subject_types_supported: string[]
    /**
     * JSON array containing a list of the OP's supported ID Token signing algorithms.
     * The only algorithm that MUST be supported is RS256. The OP SHOULD support
     * additional algorithms, such as ES256.
     */
    id_token_signing_alg_values_supported: string[]
    /**
     * JSON array containing a list of the OP's supported ID Token encryption algorithms.
     * The OP MUST support the RSA1_5 algorithm. The OP SHOULD support additional
     * algorithms, such as A128KW and A256KW.
     */
    id_token_encryption_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported ID Token encryption encodings.
     * The OP MUST support the A128CBC-HS256 encoding. The OP SHOULD support additional
     * encodings, such as A256CBC-HS512 and A128GCM.
     */
    id_token_encryption_enc_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported UserInfo signing algorithms.
     * The OP SHOULD support RS256 or ES256, or both. The OP SHOULD support none, one,
     * or more additional signing algorithms.
     */
    userinfo_signing_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported UserInfo encryption algorithms.
     * The OP SHOULD support the RSA1_5 algorithm. The OP SHOULD support additional
     * algorithms, such as A128KW and A256KW.
     */
    userinfo_encryption_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported UserInfo encryption encodings.
     * The OP SHOULD support the A128CBC-HS256 encoding. The OP SHOULD support additional
     * encodings, such as A256CBC-HS512 and A128GCM.
     */
    userinfo_encryption_enc_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Request Object signing algorithms.
     * The OP SHOULD support RS256 or ES256, or both. The OP SHOULD support none, one, or
     * more additional signing algorithms.
     */
    request_object_signing_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Request Object encryption algorithms.
     * The OP SHOULD support the RSA1_5 algorithm. The OP SHOULD support additional algorithms,
     * such as A128KW and A256KW.
     */
    request_object_encryption_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Request Object encryption encodings.
     * The OP SHOULD support the A128CBC-HS256 encoding. The OP SHOULD support additional
     * encodings, such as A256CBC-HS512 and A128GCM.
     */
    request_object_encryption_enc_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Token Endpoint authentication methods.
     * Valid methods include client_secret_post, client_secret_basic, client_secret_jwt, and
     * private_key_jwt. The OP MUST support client_secret_basic and client_secret_post.
     */
    token_endpoint_auth_methods_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported Token Endpoint authentication signing
     * algorithms. The OP MUST support RS256. The OP SHOULD support additional algorithms, such
     * as ES256.
     */
    token_endpoint_auth_signing_alg_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported display parameter values. Valid values
     * include page, popup, touch, and wap. If omitted, the default is that the OP supports only
     * the page display parameter value.
     */
    display_values_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported claim types. Valid types include normal
     * and aggregated. If omitted, the default is that the OP supports only the normal claim type.
     */
    claim_types_supported?: string[]
    /**
     * JSON array containing a list of the OP's supported claims. These are the claims that the
     * OP may be able to supply values for. Note that the individual claims supported by the OP
     * need not be listed here, and that this element is intended primarily to provide a mechanism
     * for listing those claims that are typically returned by the OP's UserInfo Endpoint.
     */
    claims_supported?: string[]
    /**
     * URL of a page containing human-readable information that developers might want or need to
     * know when using the OP. In particular, if the OP does not support dynamic client registration,
     * then information on how to register clients needs to be provided in this documentation.
     */
    service_documentation?: string
    /**
     * Languages and scripts supported for values in Claims
     */
    claims_locales_supported?: string[]
    /**
     * Languages and scripts supported for the user interface, represented as a JSON array of
     * BCP47 [RFC5646] language tag values. If omitted, the default is that the OP supports
     * only the en-US locale.
     */
    ui_locales_supported?: string[]
    /**
     * Boolean value specifying whether the OP supports use of the claims parameter, with true
     * indicating support. If omitted, the default is that the OP does not support use of the
     * claims parameter.
     */
    claims_parameter_supported?: boolean
    /**
     * Boolean value specifying whether the OP supports use of the request parameter, with true
     * indicating support. If omitted, the default is that the OP does not support use of the
     * request parameter.
     */
    request_parameter_supported?: boolean
    /**
     * Boolean value specifying whether the OP supports use of the request_uri parameter, with
     * true indicating support. If omitted, the default is that the OP does not support use of
     * the request_uri parameter.
     */
    request_uri_parameter_supported?: boolean
    /**
     * Boolean value specifying whether the OP requires any request_uri values used to be
     * pre-registered using the request_uris registration parameter, with true indicating
     * that any such request_uri values need to be pre-registered. If omitted, the default
     * is that the OP does not require pre-registration of request_uri values.
     */
    require_request_uri_registration?: boolean
    /**
     * URL that the OpenID Provider provides to the person registering the Client to read
     * about the OP's requirements on how the client can use the request_uri parameter. The
     * registration process SHOULD display this URL to the person registering the Client if
     * the OP requires pre-registration of request_uri values.
     */
    op_policy_uri?: string
    /**
     * URL that the OpenID Provider provides to the person registering the Client to read
     * about the OP's terms of service. The registration process SHOULD display this URL to
     * the person registering the Client if the OP provides such a URL.
     */
    op_tos_uri?: string
}

export type OpenIDProvider<Profile extends object = Record<string, any>, DefaultUser = User, Issuer extends string = string> = {
    id: string
    name: string
    /**
     * URL to concatenating the string /.well-known/openid-configuration to the Issuer.
     */
    issuer: Issuer
    clientId?: string
    clientSecret?: string
    /**
     * Refresh window in seconds before the access token expires to attempt a refresh.
     * Defaults to 300 seconds.
     */
    refreshWindow?: number
    /**
     * Revoke the access token configuration for the OAuth provider. It revokes the access token but not
     * invalidate the session when there are multiple access token configured for the session.
     */
    revokeToken?:
        | string
        | { url: string; headers?: Record<string, string>; params?: Record<RevokeTokenParams, RevokeTokenTokenHint> }
    /**
     * Override the default OIDC scope (`openid profile email`).
     */
    scope?: string
    profile?: (profile: Profile) => DefaultUser | Promise<DefaultUser>
} & GetRouteParams<`/${Issuer}`>
