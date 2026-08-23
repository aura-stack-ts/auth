import { api } from "~/lib/auth"
import { SignUp } from "~/components/server/sign-up"
import type { Route } from "../../server/sign-up/+types"

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData()
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    return await api.signUp({
        payload: {
            username,
            email,
            password,
        },
        request,
        redirect: true,
        redirectTo: "/server/profile",
    })
}

export const SignUpPage = () => {
    return (
        <section className="main-container">
            <SignUp />
        </section>
    )
}

export default SignUpPage
