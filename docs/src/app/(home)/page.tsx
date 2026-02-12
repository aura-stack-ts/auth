import { Header } from "@/components/home/header"
import { Hero } from "@/components/home/hero"
import { Lines } from "@/components/ui/lines"
import { PoweredBy } from "@/components/home/powered-by"
import { CallToAction } from "@/components/home/call-to-action"
import { WhatYouGet } from "@/components/home/what-you-get"
import { FAQ } from "@/components/home/faq"
import { Footer } from "@/components/home/footer"
import { Integrations } from "@/components/home/integrations"
import { Testimonials } from "@/components/home/testimonials"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-primary antialiased relative overflow-hidden">
            <Header />
            <Hero />
            <PoweredBy />
            <div className="py-10 border-t border-border" />
            <WhatYouGet />
            <div className="py-10 border-t border-border" />
            <Integrations />
            <div className="py-10 border-t border-border" />
            <Testimonials />
            <div className="py-10 border-t border-border" />
            <FAQ />
            <div className="py-10 border-t border-border" />
            <CallToAction />
            <Footer />
            <Lines />
        </div>
    )
}
