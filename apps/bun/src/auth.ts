import { type AuthInstance, createAuth } from "@aura-stack/auth"

/**
 * @todo: fix the types for the handlers, jose, and api properties of the AuthInstance
 */
export const { handlers, jose, api } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
}) satisfies AuthInstance