import { SignInProps } from "@/@types/props"
import { Button } from "@/components/ui/button"

export const SignIn = ({ id, name }: SignInProps) => {
    return (
        <form className="size-full" action={`/auth/signIn/${id}`}>
            <input type="hidden" name="redirectTo" value="/users/profile" />
            <Button className="size-full" variant="outline">
                {name}
            </Button>
        </form>
    )
}
