import { CardContent, CardHeader } from "@/components/ui/card"
import { Lock, Zap, RefreshCcw } from "lucide-react"
import { FeatureCard } from "./card"
import { CardHeading } from "./heading"

export const Features = () => {
    return (
        <section className="py-6 bg-zinc-50 dark:bg-transparent">
            <div className="w-11/12 mx-auto grid gap-6 lg:max-w-5xl lg:grid-cols-2">
                <FeatureCard>
                    <CardHeader className="pb-3">
                        <CardHeading icon={Lock} title="Secure & Robust" description="Server functions you can trust." />
                    </CardHeader>
                    <CardContent className="pt-6 relative border-t border-dashed">
                        Authenticate users directly in loaders and server functions. Aura Auth handles the heavy lifting of
                        session validation and authorization checks securely on the server.
                    </CardContent>
                </FeatureCard>
                <FeatureCard>
                    <CardHeader className="pb-3">
                        <CardHeading icon={Zap} title="Reactive & Fast" description="Hooks for modern interfaces." />
                    </CardHeader>
                    <CardContent className="pt-6 relative border-t border-dashed">
                        Build dynamic UIs with React hooks that give you instant access to user session state, sign-in methods,
                        and sign-out functionality without prop drilling.
                    </CardContent>
                </FeatureCard>
                <FeatureCard className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardHeading
                            icon={RefreshCcw}
                            title="Seamless Syncing"
                            description="Server and client state in harmony."
                        />
                    </CardHeader>
                    <CardContent className="pt-6 relative border-t border-dashed">
                        Never worry about hydration mismatches again. Aura Auth keeps your server session and client state
                        perfectly synchronized automatically.
                    </CardContent>
                </FeatureCard>
            </div>
        </section>
    )
}

Features.displayName = "Features"
