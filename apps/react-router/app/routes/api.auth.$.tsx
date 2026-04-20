import { handlers } from "~/lib/auth"
import type { Route } from "./+types/api.auth.$"

export const loader = async ({ request }: Route.LoaderArgs) => {
    return handlers.GET(request)
}

export const action = async ({ request }: Route.ActionArgs) => {
    const method = request.method.toUpperCase()
    if (method === "PATCH") {
        return handlers.PATCH(request)
    }
    return handlers.POST(request)
}
