<script setup lang="ts">
import { X, Menu } from "lucide-vue-next"

const isOpen = ref(false)
const { loading, isAuthenticated, signOut } = useAuthClient()

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
                <a
                    href="https://aura-stack-auth.vercel.app/docs"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                    target="_blank"
                >
                    Documentation
                </a>
                <a
                    href="https://github.com/aura-stack-ts/auth"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                    target="_blank"
                >
                    Repository
                </a>
                <a
                    href="https://discord.com/invite/anXExMR5"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                    target="_blank"
                >
                    Discord
                </a>
            </ul>
            <Button v-if="!loading && !isAuthenticated" class="hidden md:flex" variant="outline" size="sm" as-child>
                <NuxtLink to="/">Sign In</NuxtLink>
            </Button>
            <Button v-if="isAuthenticated" class="hidden md:flex" variant="outline" size="sm" @click="signOut">Sign Out</Button>
            <Button class="md:hidden text-white" variant="outline" aria-label="Toggle menu" @click="toggleMenu">
                <Menu v-if="!isOpen" />
                <X v-else />
            </Button>
        </nav>
        <nav
            class="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]"
            v-if="isOpen"
        >
            <div class="px-6 py-4 flex flex-col gap-4">
                <NuxtLink to="/" class="text-sm text-white/60 hover:text-white transition-colors py-2" @click="closeMenu">
                    Getting started
                </NuxtLink>
                <a
                    href="https://github.com/aura-stack-ts/auth"
                    class="text-sm text-white/60 hover:text-white transition-colors py-2"
                    target="_blank"
                    @click="closeMenu"
                >
                    Repository
                </a>
                <a
                    href="https://discord.com/invite/anXExMR5"
                    class="text-sm text-white/60 hover:text-white transition-colors py-2"
                    target="_blank"
                    @click="closeMenu"
                >
                    Discord
                </a>
                <div class="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                    <Button v-if="!loading && !isAuthenticated" class="md:hidden" variant="outline" size="sm" as-child>
                        <NuxtLink to="/">Sign In</NuxtLink>
                    </Button>
                    <Button v-if="isAuthenticated" class="md:hidden" variant="outline" size="sm" @click="signOut"
                        >Sign Out</Button
                    >
                </div>
            </div>
        </nav>
    </header>
</template>
