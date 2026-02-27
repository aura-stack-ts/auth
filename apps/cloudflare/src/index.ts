import { handlers } from "./auth"

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `pnpm dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ or http://127.0.0.1:8787/ to see your worker in action
 * - Run `pnpm deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `pnpm typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request): Promise<Response> {
        const pathname = new URL(request.url).pathname
        if (pathname === "/") {
            return new Response("Hello World from GET / endpoint")
        }
        if (pathname.startsWith("/api/auth/")) {
            const handler = handlers[request.method as keyof typeof handlers]
            if (!handler) {
                return Response.json({ error: "Method Not Allowed" }, { status: 405 })
            }
            return await handler(request)
        }
        return new Response("Not Found", { status: 404 })
    },
} satisfies ExportedHandler<Env>
