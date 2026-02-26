import type { createAuth } from "@/index.ts"
import { createClient as createClientAPI } from "@aura-stack/router"

export type { Client, ClientOptions } from "@aura-stack/router/types"
export type AuthClient = ReturnType<typeof createAuth>["handlers"]
export const createClient = createClientAPI<AuthClient>