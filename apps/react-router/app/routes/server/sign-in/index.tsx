import { SignIn } from "~/components/server/sign-in"
import { api } from "~/lib/auth"
import type { Route } from "../../server/sign-in/+types"

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData()
    const username = formData.get("email") as string
    const password = formData.get("password") as string

    return await api.signInCredentials({
        payload: {
            username,
            password,
        },
        request,
        redirect: true,
        redirectTo: "/server/profile",
    })
}

export const SignInPage = () => {
    return (
        <section className="main-container">
            <SignIn />
        </section>
    )
}

export default SignInPage
