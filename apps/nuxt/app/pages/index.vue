<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next"
import Button from "~/components/ui/button/Button.vue"
import Footer from "~/components/footer.vue"

const flow = [
    {
        title: "Overview",
        body: "This demo compares two rendering strategies for the same auth flow in Nuxt while sharing the same Aura Auth.",
        href: "https://aura-stack-auth.vercel.app/",
        external: true,
    },
    {
        title: "Server-Side Rendering",
        body: "Session is initialized from server API data and auth operations are demonstrated with Nuxt composables over the same API.",
        href: "/server",
        external: false,
    },
    {
        title: "Client-Side Rendering",
        body: "The same auth operations are driven through useAuthClient to show pending states and browser-driven interactions.",
        href: "/client",
        external: false,
    },
]
</script>

<template>
    <main class="min-h-container relative flex flex-col overflow-hidden bg-black">
        <section class="flex-1 w-11/12 max-w-6xl mx-auto p-6 flex items-center relative border-b border-x border-muted">
            <div class="space-y-7 max-w-4xl">
                <h1 class="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-7xl">
                    <span
                        class="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text"
                    >
                        Nuxt Auth
                    </span>
                </h1>
                <p class="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                    A focused integration showcase for comparing authentication behavior across server-side and client-side
                    rendering. Explore each implementation and inspect how the same flow is expressed through Nuxt composables and
                    API handlers.
                </p>
                <div class="flex flex-wrap gap-3 pt-2">
                    <Button variant="secondary" as-child>
                        <NuxtLink to="/server" class="inline-flex items-center gap-2">
                            Open SSR Reference
                            <ArrowRight class="size-3" />
                        </NuxtLink>
                    </Button>
                    <Button variant="outline" as-child>
                        <NuxtLink to="/client" class="inline-flex items-center gap-2">
                            Open CSR Reference
                            <ArrowRight class="size-3" />
                        </NuxtLink>
                    </Button>
                </div>
            </div>
        </section>
        <section class="w-11/12 p-6 max-w-6xl mx-auto border-x border-muted">
            <div class="grid gap-4 md:grid-cols-3">
                <article v-for="item in flow" :key="item.title" class="p-6 flex flex-col border border-muted">
                    <h2 class="text-3xl tracking-tight text-white">{{ item.title }}</h2>
                    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ item.body }}</p>
                    <Button class="w-min mt-6" variant="outline" as-child>
                        <a
                            :href="item.href"
                            :target="item.external ? '_blank' : undefined"
                            :rel="item.external ? 'noopener noreferrer' : undefined"
                        >
                            Try Now
                        </a>
                    </Button>
                </article>
            </div>
        </section>
        <Footer />
    </main>
</template>
