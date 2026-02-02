import { fetchAsync } from "@/request.js"
import { generateSecure } from "@/secure.js"
import { OAuthErrorResponse } from "@/schemas.js"
import { isNativeError, isOAuthProtocolError, OAuthProtocolError } from "@/errors.js"
import type { Logger, OAuthProviderCredentials, User } from "@/@types/index.js"

/**
 * Map the default user information fields from the OAuth provider's userinfo response
 *
 * @param profile - Raw profile object returned by the userinfo endpoint
 * @returns The standardized OAuth user profile
 */
const getDefaultUserInfo = (profile: Record<string, string>): User => {
    const sub = generateSecure(16)

    return {
        sub: profile?.id ?? profile?.sub ?? sub,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.image ?? profile?.picture,
    }
}

/**
 * Get user information from the OAuth provider's userinfo endpoint using the provided access token.
 * The response by default is mapped to the standardized `User` format unless a custom
 * `profile` function is provided in the `oauthConfig`.
 *
 * @param oauthConfig - OAuth provider configuration
 * @param accessToken - Access Token to access the userinfo endpoint
 * @returns The user information retrieved from the userinfo endpoint
 */
export const getUserInfo = async (oauthConfig: OAuthProviderCredentials, accessToken: string, logger?: Logger) => {
    const userinfoEndpoint = oauthConfig.userInfo
    try {
        logger?.log({
            facility: 10,
            severity: "debug",
            msgId: "OAUTH_USERINFO_REQUEST_INITIATED",
            message: "Initiating OAuth userinfo request",
            structuredData: {
                endpoint: userinfoEndpoint,
            },
        })
        const response = await fetchAsync(userinfoEndpoint, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) {
            logger?.log({
                facility: 10,
                severity: "error",
                msgId: "OAUTH_USERINFO_INVALID_RESPONSE",
                message: `Invalid userinfo response format. HTTP ${response.status}`,
                structuredData: {
                    status: response.status.toString(),
                    bearer_token: accessToken,
                },
            })
            throw new OAuthProtocolError("invalid_request", "Invalid userinfo response format")
        }

        const json = await response.json()
        const { success } = OAuthErrorResponse.safeParse(json)
        if (success) {
            logger?.log({
                facility: 10,
                severity: "error",
                msgId: "OAUTH_USERINFO_ERROR",
                message: "Error response received from OAuth userinfo endpoint",
                structuredData: {
                    oauth_error: json.error || "unknown",
                },
            })
            throw new OAuthProtocolError(
                json.error || "invalid_request",
                json?.error_description ?? "An error was received from the OAuth userinfo endpoint."
            )
        }

        logger?.log({
            facility: 10,
            severity: "info",
            msgId: "OAUTH_USERINFO_SUCCESS",
            message: "OAuth userinfo retrieved successfully",
        })
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch (error) {
        if (isOAuthProtocolError(error)) {
            throw error
        }
        logger?.log({
            facility: 10,
            severity: "error",
            msgId: "OAUTH_USERINFO_REQUEST_FAILED",
            message: "Failed to fetch user information from OAuth provider",
            structuredData: {
                error_type: error instanceof Error ? error.name : "Unknown",
            },
        })
        if (isNativeError(error)) {
            throw new OAuthProtocolError("server_error", "Failed to fetch user information from OAuth provider", "", {
                cause: error,
            })
        }
        throw new OAuthProtocolError("server_error", "Failed to fetch user information", "", { cause: error })
    }
}
