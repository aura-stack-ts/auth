import { handlers } from "~/lib/auth"
import type { Route } from "./+types/api.auth.$"

export const loader = async ({ request }: Route.LoaderArgs) => {
    return handlers.GET(request)
}

export const action = async ({ request }: Route.ActionArgs) => {
    return handlers.ALL(request)
}
