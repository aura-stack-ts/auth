/**
 * React-specific auth types: context value, provider props, and the browser client instance shape.
 *
 * Re-exports of core session/user types come from `@aura-stack/auth/types` via `@aura-stack/react/types`.
 */
import type { ReactNode } from "react"
import type {
    CredentialsPayload,
    DeepPartial,
    LiteralUnion,
    BuiltInOAuthProvider,
    Session,
    SignInOptions,
    SignOutOptions,
    User,
} from "@aura-stack/auth/types"

/**
 * The object returned by {@link createAuthClient} for a given user type, including `getSession`, `signIn`, `signOut`, etc.
 */
export type AuthClientInstance<DefaultUser extends User = User> = ReturnType<
    typeof import("@aura-stack/auth/client").createAuthClient<DefaultUser>
>

/** High-level UI state for whether a session is present, absent, or still being resolved. */
export type AuthStatus = "authenticated" | "unauthenticated" | "loading"

/** Options for {@link AuthReactContextValue.updateSession} (React layer; not sent to the HTTP API). */
export type UpdateSessionCallOptions = {
    /** When true, skip syncing session state via {@link AuthReactContextValue.refresh} after the update. */
    skipRefresh?: boolean
}

/**
 * Full auth surface exposed through a single React context so session state and
 * mutations share one source of truth (no duplicate session fetches per subtree).
 */
export type AuthReactContextValue<DefaultUser extends User = User> = {
    /** Current session, `null` if unauthenticated, or `undefined` before the first load completes. */
    session: Session<DefaultUser> | null | undefined
    status: AuthStatus
    /** True while a transition updates session state (e.g. after refresh or a non-redirect sign-in). */
    isPending: boolean
    /** Bound auth HTTP client (same API as `createAuthClient`). */
    client: AuthClientInstance<DefaultUser>
    /** Re-fetches session from the server and updates context state. */
    refresh: () => Promise<void>
    signIn: (
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: SignInOptions
    ) => ReturnType<AuthClientInstance<DefaultUser>["signIn"]>
    signInCredentials: (
        credentials: CredentialsPayload,
        options?: SignInOptions
    ) => ReturnType<AuthClientInstance<DefaultUser>["signInCredentials"]>
    signOut: (options?: SignOutOptions) => ReturnType<AuthClientInstance<DefaultUser>["signOut"]>
    updateSession: (
        partial: DeepPartial<Session<DefaultUser>>,
        options?: UpdateSessionCallOptions
    ) => ReturnType<AuthClientInstance<DefaultUser>["updateSession"]>
}

/** Props for {@link AuthProvider}: supply the client and optional SSR session to avoid a flash of loading state. */
export type AuthProviderProps<DefaultUser extends User = User> = {
    children: ReactNode
    /** Auth API client from {@link createAuthClient}; swap this instance whenever your app needs a different client. */
    client: AuthClientInstance<DefaultUser>
    /**
     * Server-rendered session when available. Omit or pass `undefined` to fetch on mount.
     * Pass `null` when the server knows there is no session (skip the initial client fetch).
     */
    initialSession?: Session<DefaultUser> | null
}
