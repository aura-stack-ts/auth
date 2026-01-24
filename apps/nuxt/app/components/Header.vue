<script setup lang="ts">
import {} from "lucide-vue-next"
import { Button } from "@/components/ui/button.vue"

const isOpen = ref(false)

const toggleMenu = () => {
    isOpen.value = !isOpen.value
}

const closeMenu = () => {
    isOpen.value = false
}
</script>

<template>
    <header class="fixed top-0 w-full z-50 border-b border-muted bg-black/80 backdrop-blur-md">
        <nav class="w-11/12 max-w-5xl mx-auto py-4 flex items-center justify-between">
            <a class="text-xl font-semibold" href="/">Aura Auth</a>
            <ul
                class="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
                <a class="text-sm text-white/60 transition-colors hover:text-white" href="/">Documentation</a>
                <a class="text-sm text-white/60 transition-colors hover:text-white" href="/">Repository</a>
                <a class="text-sm text-white/60 transition-colors hover:text-white" href="/">Discord</a>
            </ul>
            <Button variant="outline"> nose </Button>
        </nav>
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
            <div className="px-6 py-4 flex flex-col gap-4">
                <NuxtLink to="/signIn" className="text-sm text-white/60 hover:text-white transition-colors py-2">
                    Getting started
                </NuxtLink>
                <a
                    href="https://github.com/aura-stack-ts/auth"
                    className="text-sm text-white/60 hover:text-white transition-colors py-2"
                    target="_blank"
                >
                    Repository
                </a>
                <a
                    href="https://discord.com/invite/anXExMR5"
                    className="text-sm text-white/60 hover:text-white transition-colors py-2"
                    target="_blank"
                >
                    Discord
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50"></div>
            </div>
        </div>
    </header>
</template>
