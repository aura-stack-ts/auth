import { handlers } from "~/auth"
import type { Route } from "./+types/auth.$"

export const loader = async ({ request }: Route.LoaderArgs) => {
    return handlers.GET(request)
}

export const action = async ({ request }: Route.ActionArgs) => {
    return handlers.POST(request)
}
