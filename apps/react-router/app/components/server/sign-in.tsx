import { Form, Link } from "react-router"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { GitHubIcon } from "~/components/icons/github"
import { GitLabIcon } from "~/components/icons/gitlab"
import { BitbucketIcon } from "~/components/icons/bitbucket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSeparator, FieldDescription } from "~/components/ui/field"

const providers = [
    {
        id: "github",
        name: "GitHub",
        icon: <GitHubIcon />,
    },
    {
        id: "gitlab",
        name: "GitLab",
        icon: <GitLabIcon />,
    },
    {
        id: "bitbucket",
        name: "Bitbucket",
        icon: <BitbucketIcon />,
    },
]

export const SignIn = () => {
    return (
        <Card className="w-full max-w-lg px-6 py-8 sm:p-12 relative gap-6">
            <CardHeader className="text-center gap-6 p-0">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-2xl font-medium text-card-foreground">Welcome to Aura Stack</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-normal">
                        Enter your credentials below to log in to your account
                    </CardDescription>
                    <CardDescription className="mt-4 text-sm text-muted-foreground font-normal">
                        Official Next.js demo to showcase @aura-stack/next authentication library with Client Side Rendering{" "}
                        <Link className="text-white underline underline-offset-2" to="/client/sign-in">
                            (CSR)
                        </Link>{" "}
                        for Server-Side Rendering{" "}
                        <Link className="text-white underline underline-offset-2" to="/server/sign-in">
                            (SSR)
                        </Link>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Form method="POST">
                    <FieldGroup className="gap-6">
                        <div className="flex flex-col gap-4">
                            <Field className="gap-1.5">
                                <FieldLabel htmlFor="email" className="text-sm text-muted-foreground font-normal">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="aurastackjs@gmail.com"
                                    required
                                    aria-label="email"
                                    autoComplete="email"
                                    className="dark:bg-background h-9 shadow-xs"
                                />
                            </Field>
                            <Field className="gap-1.5">
                                <div className="flex items-center">
                                    <FieldLabel className="text-sm text-muted-foreground font-normal" htmlFor="password">
                                        Password
                                    </FieldLabel>
                                    <Link to="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    aria-label="Password"
                                    autoComplete="current-password"
                                    className="dark:bg-background h-9 shadow-xs"
                                />
                            </Field>
                        </div>
                        <Field>
                            <Button type="submit" size="lg">
                                Sign in
                            </Button>
                        </Field>
                        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-sm text-muted-foreground bg-transparent">
                            <span className="px-4">or continue with</span>
                        </FieldSeparator>
                        <Field className="space-y-2">
                            {providers.map((provider) => (
                                <Button key={provider.id} variant="outline" type="button">
                                    {provider.icon}
                                    Sign in with {provider.name}
                                </Button>
                            ))}
                            <FieldDescription className="mb-0 text-center text-sm font-normal text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link to="/server/sign-up" className="font-medium text-card-foreground">
                                    Sign Up
                                </Link>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </Form>
            </CardContent>
        </Card>
    )
}

export default SignIn
