import { SignInProps } from "@/@types/props"
import { Button } from "@/components/ui/button"

export const SignIn = ({ identity }: SignInProps) => {
    return (
        <form className="size-full" action={`/auth/signIn/${identity}`}>
            <Button className="size-full" variant="outline">
                {identity}
            </Button>
        </form>
    )
}
