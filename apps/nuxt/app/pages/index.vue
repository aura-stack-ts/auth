<script setup lang="ts">
import { useAuthClient } from "~/composables/useAuthClient"
import { LayoutDashboard, Fingerprint } from "lucide-vue-next"
import { builtInOAuthProviders } from "@aura-stack/auth/oauth/index"

const { session, isAuthenticated, isLoading, signIn, signOut } = useAuthClient()

const providers = {
    github: builtInOAuthProviders.github,
    gitlab: builtInOAuthProviders.gitlab,
    x: builtInOAuthProviders.x,
}
</script>

<template>
    <main class="flex-1 bg-black">
        <section class="border-b border-muted">
            <div class="w-11/12 max-w-5xl mx-auto py-24 px-6 md:border-x border-muted space-y-8">
                <div class="space-y-4 max-w-3xl">
                    <div
                        class="px-3 py-1 inline-flex items-center gap-2 text-xs font-mono text-foreground rounded-full border border-muted"
                    >
                        <span class="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Integration Example
                    </div>
                    <h1 class="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-7xl">
                        Nuxt Auth Powered by<br />
                        <span
                            class="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text"
                        >
                            Aura Auth core
                        </span>
                    </h1>
                    <p class="max-w-xl text-lg text-foreground leading-relaxed">
                        This example demonstrates how to integrate Aura Auth into a Nuxt application. It showcases how to use the
                        useAuth composable to manage session state on the client side.
                    </p>
                </div>
            </div>
        </section>
        <section class="overflow-hidden">
            <div class="w-11/12 max-w-5xl mx-auto md:border-x border-muted grid grid-cols-1 md:grid-cols-2">
                <div class="p-8 md:p-12 border-b md:border-b-0 md:border-r border-muted space-y-12 bg-white/1">
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 text-foreground">
                            <Fingerprint class="h-4 w-4" />
                            <span class="text-white text-xs font-mono uppercase tracking-widest">Aura Auth Integration</span>
                        </div>
                        <p class="text-sm text-white/40 leading-relaxed">
                            This integration example is not representative of a production application. It demonstrates core
                            authentication flows and session management patterns for showcase purposes.
                        </p>
                    </div>
                </div>
                <div class="p-8 flex items-center justify-center bg-black md:p-12">
                    <div v-if="isLoading" class="flex flex-col items-center gap-4 py-8">
                        <div class="size-8 border-2 border-muted rounded-full animate-spin" />
                        <span class="text-xs font-mono text-foreground uppercase tracking-widest">Syncing state</span>
                    </div>
                    <div v-else class="w-full max-w-sm space-y-6">
                        <transition name="fade" mode="out-in">
                            <div v-if="isAuthenticated" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="py-3 px-2 border border-muted rounded-md space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-mono">session active</span>
                                        <LayoutDashboard class="size-4 text-foreground" />
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="size-14 rounded-full bg-linear-to-b from-white to-white/40 p-px">
                                            <div
                                                class="h-full w-full rounded-full bg-black flex items-center justify-center text-xl font-bold"
                                            >
                                                {{ session?.user?.name?.[0] || "?" }}
                                            </div>
                                        </div>
                                        <div>
                                            <p class="text-lg font-medium text-white">{{ session?.user?.name }}</p>
                                            <p class="text-xs text-white/40 font-mono">{{ session?.user?.email }}</p>
                                        </div>
                                    </div>
                                    <div class="pt-3 border-t border-muted">
                                        <div class="flex justify-between items-center text-[10px] font-mono">
                                            <span class="text-white/20 uppercase">Sub</span>
                                            <span class="text-white/60 truncate max-w-37.5">{{ session?.user?.sub }}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" @click="signOut()">Sign Out</Button>
                            </div>
                            <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-4 text-center">
                                    <h2 class="text-2xl font-semibold text-white">Sign in to continue</h2>
                                    <p class="text-sm text-white/40">
                                        Choose a provider below to authenticate and start your session.
                                    </p>
                                    <div class="flex flex-col gap-y-2">
                                        <Button
                                            v-for="provider in providers"
                                            :key="provider.id"
                                            variant="outline"
                                            size="sm"
                                            @click="signIn(provider.id)"
                                        >
                                            Sign In with {{ provider.name }}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
