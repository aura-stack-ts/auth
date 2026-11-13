import { createClient as createClientAPI } from "@aura-stack/router"
import { createClientContext } from "@/client/context.ts"
import { signIn } from "@/client/sign-in.ts"
import { signUp } from "@/client/sign-up.ts"
import { signOut } from "@/client/sign-out.ts"
import { getSession } from "@/client/get-session.ts"
import { verifyEmail } from "@/client/verify-email.ts"
import { revokeToken } from "@/client/revoke-token.ts"
import { changeEmail } from "@/client/change-email.ts"
import { updateSession } from "@/client/update-session.ts"
import { resetPassword } from "@/client/reset-password.ts"
import { sendMagicLink } from "@/client/send-magic-link.ts"
import { changePassword } from "@/client/change-password.ts"
import { forgotPassword } from "@/client/forgot-password.ts"
import { getAccessToken } from "@/client/get-access-token.ts"
import { refreshUserInfo } from "@/client/refresh-user-info.ts"
import { verifyMagicLink } from "@/client/verify-magic-link.ts"
import { cancelEmailChange } from "@/client/cancel-email-change.ts"
import { getProviderTokens } from "@/client/get-provider-tokens.ts"
import { signInCredentials } from "@/client/sign-in-credentials.ts"
import { verifyEmailChange } from "@/client/verify-email-change.ts"
import { disconnectProvider } from "@/client/disconnect-provider.ts"
import { isProviderConnected } from "@/client/is-provider-connected.ts"
import { sendVerificationEmail } from "@/client/send-verification-email.ts"
import type { AuthClient, AuthClientOptions, User } from "@/@types/index.ts"

export type { AuthClientOptions }

export const createClient = createClientAPI<AuthClient>

export const createAuthClient = <
    DefaultUser extends User = User,
    SignUpPayload extends Record<string, any> = Record<string, any>,
>(
    options?: AuthClientOptions
) => {
    const context = createClientContext(options)

    return {
        /**
         * Gets the current session for the authenticated user.
         *
         * @returns Session object if the user is authenticated, or null if not authenticated or an error occurs.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const session = await authClient.getSession()
         */
        getSession: getSession<DefaultUser>(context),
        /**
         * Initiates the sign-in process for a specified OAuth provider.
         *
         * @param oauth The OAuth provider identifier (e.g., "google", "github").
         * @param options Optional sign-in options, including redirect behavior and target URL.
         * @returns An object containing the sign-in result, including success status and redirect URL if applicable.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.signIn("google", {
         *   redirect: true,
         *   redirectTo: "/dashboard"
         * })
         */
        signIn: signIn(context),
        /**
         * Initiates the sign-in process using user credentials (e.g., email and password).
         *
         * @param options Sign-in options, including the credentials payload and redirect behavior.
         * @returns An object containing the sign-in result, including success status and redirect URL if applicable.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.signInCredentials({
         *   payload: {
         *     email: "user@example.com",
         *     password: "securepassword"
         *   }
         * })
         */
        signInCredentials: signInCredentials(context),
        /**
         * Initiates the sign-up process for a new user with the provided payload.
         *
         * @param options Sign-up options, including the payload for user registration and redirect behavior.
         * @return An object containing the sign-up result, including success status and redirect URL if applicable.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.signUp({
         *   payload: {
         *     name: "John Doe",
         *     email: "john@example.com",
         *     password: "securepassword"
         *   },
         * })
         */
        signUp: signUp<SignUpPayload>(context),
        /**
         * Updates the current session with new information, such as user data or expiration time.
         *
         * @param options Update session options, including the new session data and redirect behavior.
         * @returns An object containing the update session result, including success status and redirect URL if applicable.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.updateSession({
         *   session: {
         *     user: {
         *       name: "John Doe"
         *     }
         *   }
         * })
         */
        updateSession: updateSession<DefaultUser>(context),
        /**
         * Fetches the OAuth tokens for a specified provider, if available.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth The OAuth provider identifier (e.g., "google", "github").
         * @returns An object with `success` and `tokens`, where `tokens` is null if unavailable or on error.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.getProviderTokens("google")
         * // Expected:
         * {
         *   success: true,
         *   tokens: {
         *     accessToken: "access_token_value",
         *     expiresAt: 1234567890,
         *     refreshToken: "refresh_token_value",
         *     refreshTokenExpiresAt: 1234567890,
         *     scopes: ["scope1", "scope2"],
         *     tokenType: "Bearer",
         *   }
         * }
         */
        getProviderTokens: getProviderTokens(context),
        /**
         * Retrieves the access token for a specific OAuth provider, if available.
         *
         * > **NOTE**: This method is based on `getProviderTokens` and it's recommended for simple use cases where only the
         * access token is needed. For more advanced scenarios, consider using `getProviderTokens` directly.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth - The OAuth provider identifier (e.g., "google", "github").
         * @returns the access token string if available, or null if not available or on error.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const accessToken = await authClient.getAccessToken("google")
         * // Expected:
         * "access_token_value" or null
         */
        getAccessToken: getAccessToken(context),
        /**
         * Refreshes the user information from making a request to the user info endpoint of the specified
         * OAuth provider. This is useful for keeping the session data up-to-date without requiring the user
         * to re-authenticate.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth - The OAuth provider identifier (e.g., "google", "github").
         * @returns the updated session object if successful, or null if the refresh fails or the user is not authenticated.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const updatedSession = await authClient.refreshUserInfo("google")
         * // Expected:
         * {
         *   sub: "user_id",
         *   name: "John Doe",
         *   email: "john.doe@example.com",
         *   image: "https://example.com/avatar.jpg",
         * }
         */
        refreshUserInfo: refreshUserInfo<DefaultUser>(context),
        /**
         * Revokes the OAuth token for a specified provider. It doesn't sign out the user, but it invalidates
         * the access token, preventing further use of the token for API requests.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth - The OAuth provider identifier (e.g., "google", "github").
         * @returns A boolean indicating whether the token revocation was successful.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const success = await authClient.revokeToken("google")
         * // Expected:
         * true or false
         */
        revokeToken: revokeToken(context),
        /**
         * Disconnects the OAuth provider from the current user's account, removing the association between
         * the user's account and the OAuth provider. This action does not revoke the OAuth token, but it
         * removes the link between the user's account and the provider, effectively "disconnecting" the provider.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth - The OAuth provider identifier (e.g., "google", "github").
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // Expected: true or false
         * const success = await authClient.disconnectProvider("google")
         */
        disconnectProvider: disconnectProvider(context),
        /**
         * Verifies if the specified OAuth provider is connected to the current user's account.
         *
         *  > **NOTE**: This method is experimental and may change in future releases.
         *
         * @param oauth - The OAuth provider identifier (e.g., "google", "github").
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // Expected: true or false
         * const isConnected = await authClient.isProviderConnected("google")
         */
        isProviderConnected: isProviderConnected(context),
        /**
         * Signs out the current user, ending their session and optionally redirecting them to a specified URL.
         *
         * @param options Sign-out options, including redirect behavior and target URL after sign-out.
         * @returns An object containing the sign-out result, including success status and redirect URL if applicable.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * const output = await authClient.signOut({
         *   redirect: true,
         *   redirectTo: "/goodbye"
         * })
         */
        signOut: signOut(context),
        /**
         * Sends a verification email to the specified email address.
         *
         * @param email - The email address to send the verification email to.
         * @param options - Optional options including redirect behavior and target URL.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.sendVerificationEmail("user@example.com", {
         *   redirect: true,
         *   redirectTo: "/verify-sent"
         * })
         *
         * // manual redirect
         * const { success, redirectURL } = await authClient.sendVerificationEmail("user@example.com", {
         *   redirect: false
         * })
         */
        sendVerificationEmail: sendVerificationEmail(context),
        /**
         * Verifies an email address using a verification token.
         *
         * @param token - The verification token received from the email.
         * @param options - Optional options including redirect behavior and target URL.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.verifyEmail("verification-token-here", {
         *   redirect: true,
         *   redirectTo: "/verified"
         * })
         *
         * // manual redirect
         * const { success, redirectURL } = await authClient.verifyEmail("verification-token-here", {
         *   redirect: false
         * })
         */
        verifyEmail: verifyEmail(context),
        /**
         * Initiates the forgot password flow by sending a password reset email to the specified address.
         *
         * @param email - The email address to send the password reset email to.
         * @param options - Optional options including redirect behavior and target URL.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.forgotPassword("user@example.com", {
         *   redirect: true,
         *   redirectTo: "/check-email"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.forgotPassword("user@example.com", { redirect: false })
         */
        forgotPassword: forgotPassword(context),
        /**
         * Resets the password for a user using a valid password reset token.
         *
         * @param options - Options including the reset token, new password, and optional redirect behavior.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.resetPassword({
         *   payload: { token: "reset-token-here", newPassword: "new-password-here" },
         *   redirect: true,
         *   redirectTo: "/login"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.resetPassword({
         *   payload: { token: "reset-token-here", newPassword: "new-password-here" },
         *   redirect: false
         * })
         */
        resetPassword: resetPassword(context),
        /**
         * Changes the password for the currently authenticated user.
         *
         * @param options - Options including the current password, new password, and optional redirect behavior.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.changePassword({
         *   payload: { currentPassword: "old-password", newPassword: "new-password" },
         *   redirect: true,
         *   redirectTo: "/settings"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.changePassword({
         *   payload: { currentPassword: "old-password", newPassword: "new-password" },
         *   redirect: false
         * })
         */
        changePassword: changePassword(context),
        /**
         * Changes the email address for the currently authenticated user.
         *
         * @param options - Options including the current password, new email address, and optional redirect behavior.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.changeEmail({
         *   payload: { currentPassword: "my-password", newEmail: "alice@example.com" },
         *   redirect: true,
         *   redirectTo: "/profile"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.changeEmail({
         *   payload: { currentPassword: "my-password", newEmail: "alice@example.com" },
         *   redirect: false
         * })
         */
        changeEmail: changeEmail(context),
        /**
         * Verifies an email change request using a verification token.
         *
         * @param options - Options including the verification token and optional redirect behavior.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.verifyEmailChange({
         *   payload: { token: "email-change-token-here" },
         *   redirect: true,
         *   redirectTo: "/email-updated"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.verifyEmailChange({
         *   payload: { token: "email-change-token-here" },
         *   redirect: false
         * })
         */
        verifyEmailChange: verifyEmailChange(context),
        /**
         * Cancels an email change request. Supports two modes:
         * - Passing `payload.token` to cancel via a link in the email.
         * - Without a token, cancels the email change for the currently authenticated user.
         *
         * @param options - Options including the optional cancellation token and optional redirect behavior.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // Cancel via token (e.g., from a link in an email)
         * await authClient.cancelEmailChange({
         *   payload: { token: "cancellation-token-here" },
         *   redirect: true,
         *   redirectTo: "/settings"
         * })
         *
         * // Cancel for the currently authenticated user
         * const { success } = await authClient.cancelEmailChange({ redirect: false })
         */
        cancelEmailChange: cancelEmailChange(context),
        /**
         * Sends a magic link to the specified email address, allowing the user to sign in without a password.
         *
         * @param email - The email address to send the magic link to.
         * @param options - Optional options including redirect behavior and target URL.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.sendMagicLink("john@example.com", {
         *   redirect: true,
         *   redirectTo: "/check-email"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.sendMagicLink("john@example.com", { redirect: false })
         */
        sendMagicLink: sendMagicLink(context),
        /**
         * Verifies a magic link token and signs in the user if the token is valid.
         *
         * @param token - The magic link token received from the email.
         * @param options - Optional options including redirect behavior and target URL.
         * @returns `void` when `redirect: true` (navigation is handled automatically), or the result
         * object when `redirect: false` so the caller can handle navigation manually.
         * @example
         * const authClient = createAuthClient({ ... })
         *
         * // redirect handled automatically
         * await authClient.verifyMagicLink("magic-link-token-here", {
         *   redirect: true,
         *   redirectTo: "/dashboard"
         * })
         *
         * // manual redirect
         * const { success } = await authClient.verifyMagicLink("magic-link-token-here", {
         *   redirect: false
         * })
         */
        verifyMagicLink: verifyMagicLink(context),
    }
}
