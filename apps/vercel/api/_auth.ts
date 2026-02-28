/**
 * The files that start with an underscore (_) are not treated as Vercel Functions.
 * @see https://vercel.com/docs/functions/configuring-functions/advanced-configuration
 */
import { type AuthInstance, createAuth } from "@aura-stack/auth"

export const { handlers } = createAuth({
    oauth: ["github"],
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://*.vercel.app"],
}) as AuthInstance