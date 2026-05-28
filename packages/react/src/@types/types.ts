/**
 * React-specific auth types: context value, provider props, and the browser client instance shape.
 *
 * Re-exports of core session/user types come from `@aura-stack/auth/types` via `@aura-stack/react/types`.
 */
import type { ReactNode } from "react"
import type { Session, User } from "@aura-stack/auth/types"
import type { createAuthClient } from "@aura-stack/auth/client"

/**
 * The object returned by {@link createAuthClient} for a given user type, including `getSession`, `signIn`, `signOut`, etc.
 */
export type AuthClientInstance<DefaultUser extends User = User> = ReturnType<typeof createAuthClient<DefaultUser>>

/** High-level UI state for whether a session is present, absent, or still being resolved. */
export type AuthStatus = "authenticated" | "unauthenticated" | "pending"

export interface Context<DefaultUser extends User = User> {
    session: Session | null
    status: AuthStatus
    client: AuthClientInstance<DefaultUser>
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

/**
 * Triggerable messages for cross-tab session synchronization via BroadcastChannel.
 */
export type BroadcastMessage = { type: "session:update"; payload: Session } | { type: "session:sync" } | { type: "session:clear" }
