import { api } from "~/lib/auth"
import { Profile } from "~/components/server/profile"
import type { Route } from "../../server/profile/+types"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await api.getSession({
        headers: request.headers,
    })
    return { session }
}

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData()
    const actionType = formData.get("action")
    if (actionType === "signOut") {
        return await api.signOut({
            request,
            redirectTo: "/server/sign-in",
        })
    } else if (actionType === "updateSession") {
        return await api.updateSession({
            session: {
                user: {
                    name: (formData.get("username") as string) || undefined,
                    email: (formData.get("email") as string) || undefined,
                },
            },
            request,
            redirectTo: "/server/profile",
        })
    }
    return null
}

export const ProfilePage = () => {
    return (
        <section className="main-container">
            <Profile />
        </section>
    )
}

export default ProfilePage
