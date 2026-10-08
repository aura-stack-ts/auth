import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/auth"

export const SignUp = () => {
    const onSubmit = async (formData: FormData) => {
        "use server"
        const username = formData.get("username") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (password !== confirmPassword) {
            return
        }
        await api.signUp({
            payload: {
                username,
                email,
                password,
            },
            redirectTo: "/server/profile",
        })
    }

    return (
        <section className="w-full max-w-lg flex flex-col items-center justify-center gap-y-6">
            <Card className="w-full px-6 py-8 gap-6">
                <CardHeader className="text-center gap-6 p-0">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-medium text-card-foreground">Welcome to Aura Stack</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground font-normal">
                            Fill in the form below to create your account
                        </CardDescription>
                        <CardDescription className="mt-4 text-sm text-muted-foreground font-normal">
                            Official Next.js demo to showcase @aura-stack/next authentication library with Client Side Rendering{" "}
                            <Link className="text-white underline underline-offset-2" href="/client/sign-up">
                                (CSR)
                            </Link>{" "}
                            for Server-Side Rendering{" "}
                            <Link className="text-white underline underline-offset-2" href="/server/sign-up">
                                (SSR)
                            </Link>
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="w-full">
                    <form action={onSubmit}>
                        <FieldGroup className="gap-6">
                            <div className="flex flex-col gap-4">
                                <Field className="gap-1.5">
                                    <FieldLabel htmlFor="username" className="text-sm">
                                        Username
                                    </FieldLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        name="username"
                                        required
                                        placeholder="johndoe"
                                        aria-label="Username"
                                        className="dark:bg-background h-9 shadow-xs"
                                    />
                                </Field>
                                <Field className="gap-1.5">
                                    <FieldLabel htmlFor="email" className="text-sm">
                                        Email
                                    </FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="name@example.com"
                                        aria-label="Email"
                                        className="dark:bg-background h-9 shadow-xs"
                                    />
                                </Field>
                                <FieldGroup className="flex-row">
                                    <Field className="gap-1.5">
                                        <FieldLabel className="text-sm" htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            aria-label="Password"
                                            className="dark:bg-background h-9 shadow-xs"
                                        />
                                    </Field>
                                    <Field className="gap-1.5">
                                        <FieldLabel className="text-sm" htmlFor="confirmPassword">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            aria-label="Confirm Password"
                                            className="dark:bg-background h-9 shadow-xs"
                                        />
                                    </Field>
                                </FieldGroup>
                            </div>
                            <Field className="gap-4">
                                <Button type="submit" size="lg">
                                    Create Account
                                </Button>
                                <FieldDescription className="mb-0 text-center text-sm font-normal text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/server/sign-in" className="font-medium text-card-foreground">
                                        Sign in
                                    </Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </section>
    )
}

export default SignUp
