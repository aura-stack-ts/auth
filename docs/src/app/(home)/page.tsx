import { Footer } from "@/ui/home/footer"
import { Header } from "@/ui/home/header"
import { Hero } from "@/ui/home/hero"
import { Configuration } from "@/ui/home/configuration"
import { WhyAuraAuth } from "@/ui/home/why-aura-auth"
import { Features } from "@/ui/home/features"
import { ContributeOpenSource } from "@/ui/home/contribute-oss"
import { Statistics } from "@/ui/home/statistics"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-primary antialiased">
            <Header />
            <main className="max-w-6xl mx-auto px-3 my-4 divide-x divide-border sm:my-6 sm:px-5 md:my-10 md:px-8 base:my-10 base:px-12">
                <div className="border border-border divide-y divide-border">
                    <Hero />
                    <Configuration />
                    <WhyAuraAuth />
                    <Features />
                    <Statistics />
                    <ContributeOpenSource />
                </div>
            </main>
            <Footer />
        </div>
    )
}
