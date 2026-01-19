import { SignInProps } from "@/@types/props"
import { Button } from "@/components/ui/button"

export const SignIn = ({ id, name }: SignInProps) => {
    return (
        <form className="size-full" action={`/auth/signIn/${id}`}>
            <Button className="size-full" variant="outline">
                {name}
            </Button>
        </form>
    )
}
