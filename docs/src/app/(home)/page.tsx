import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Lines } from "@/components/lines"
import { FinalCTA } from "@/ui/home/contribute-oss"
import { ExploreUseCases } from "@/ui/home/explore-use-cases"
import { FAQ } from "@/ui/home/faq"
import { Footer } from "@/ui/home/footer"
import { Integrations } from "@/ui/home/integrations"
import { RuntimeSupport } from "@/ui/home/runtime-support"
import { WhatYouGet } from "@/ui/home/what-you-get"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-primary antialiased relative overflow-hidden">
            <Lines />
            <Header />
            <Hero />
            <WhatYouGet />
            <div className="py-10 border-t border-white/20"></div>
            <ExploreUseCases />
            <div className="py-10 border-t border-white/20"></div>
            <RuntimeSupport />
            <div className="py-10 border-t border-white/20"></div>
            <Integrations />
            <div className="py-10 border-t border-white/20"></div>
            <FAQ />
            <div className="py-10 border-t border-white/20"></div>
            <FinalCTA />
            <Footer />
        </div>
    )
}
