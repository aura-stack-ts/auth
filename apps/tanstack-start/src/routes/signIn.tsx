import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { SignIn } from "@/components/sign-in"
import { Button } from "@/components/ui/button"
import { ChevronLeft, BookOpen } from "lucide-react"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { OAuthProviderConfig } from "@aura-stack/auth"

export const Route = createFileRoute("/signIn")({
    component: RouteComponent,
})

function RouteComponent() {
    const identities = Object.values(builtInOAuthProviders) as OAuthProviderConfig[]

    return (
        <section className="w-full min-h-screen pt-36 pb-6 flex flex-col items-center justify-center relative bg-black base:pt-22">
            <div className="absolute top-20 left-4 md:top-22">
                <Button
                    variant="ghost"
                    asChild
                    className="gap-2 hover:bg-transparent hover:text-primary pl-0 sm:pl-4 transition-colors"
                >
                    <Link to="/">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
            <Card className="w-11/12 max-w-md mx-auto shadow-xl border-muted rounded-md bg-transparent backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account to continue</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                    {identities.map((identity) => (
                        <SignIn key={identity.id} id={identity.id} name={identity.name} />
                    ))}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 text-muted-foreground bg-black">Or</span>
                        </div>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                        <p>Need help configuring providers?</p>
                        <a
                            href="https://aura-stack-auth.vercel.app/docs/oauth"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-primary hover:underline transition-all"
                        >
                            <BookOpen className="w-3 h-3" />
                            Read the Documentation
                        </a>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 bg-muted/10">
                    <p className="text-xs text-center text-muted-foreground">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
        </section>
    )
}
