<script setup lang="ts">
import type { Session } from "@aura-stack/auth"
import type { SubmitEvent } from "@vue/runtime-dom"
import Button from "~/components/ui/button/Button.vue"
import EditProfile from "~/components/edit-profile.vue"

const { data: initialSession } = await useFetch<Session | null>("/api/auth/session", {
    server: true,
    default: () => null,
})

const { session, status, isPending, signIn, signOut, signInCredentials, updateSession } = useAuthClient(initialSession.value)
const isAuthenticated = computed(() => status.value === "authenticated")

const handleSignInCredentials = async (event: SubmitEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    await signInCredentials(
        {
            username,
            password,
        },
        { redirectTo: "/server" }
    )
}

const handleUpdateSession = async (formData: FormData) => {
    await updateSession({
        user: {
            name: formData.get("username") ? (formData.get("username") as string) : undefined,
            email: formData.get("email") ? (formData.get("email") as string) : undefined,
        },
    })
}
</script>

<template>
    <main class="w-11/12 min-h-container max-w-5xl mx-auto content-center">
        <section class="max-w-lg mx-auto space-y-8">
            <div class="text-center">
                <h1 class="text-2xl font-bold text-white">Aura Auth + Nuxt Server Components</h1>
                <p class="mt-2 text-base text-white/70 max-w-3xl">
                    Official Nuxt demo to showcase @aura-stack/auth authentication library with server-initialized session and
                    Server Side Rendering (SSR), for Client-Side Rendering (CSR) visit
                    <NuxtLink class="text-white underline underline-offset-2" to="/client"> here </NuxtLink>
                </p>
            </div>
        </section>
        <section class="mt-8 max-w-lg mx-auto border bg-black">
            <div v-if="isAuthenticated" class="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <img
                    v-if="session?.user?.image"
                    class="rounded-full"
                    :src="session.user.image"
                    :alt="`User image ${session.user?.name}`"
                    width="56"
                    height="56"
                />
                <span v-else class="size-14 block rounded-full ring-2 ring-white/40">
                    <span
                        class="h-full w-full p-0.5 aspect-square text-xl font-bold flex items-center justify-center rounded-full bg-black"
                    >
                        {{ session?.user?.name?.[0] || "?" }}
                    </span>
                </span>

                <div class="flex items-center justify-between">
                    <div class="mt-2">
                        <p class="text-lg font-medium text-white">{{ session?.user?.name }}</p>
                        <p class="text-xs text-white/40 font-mono">{{ session?.user?.email }}</p>
                    </div>
                </div>
                <EditProfile :action="handleUpdateSession" />
                <form class="my-4 pt-4 flex items-center justify-between gap-x-4 border-t" @submit.prevent="signOut()">
                    <div>
                        <label class="font-medium block" for="signout">Sign Out of the device</label>
                        <span class="text-sm">Sign out of the device with active session</span>
                    </div>
                    <Button class="w-20" variant="default" type="submit">Sign Out</Button>
                </form>
                <span class="w-full h-px block bg-white/40" />
                <span class="mt-4 block text-center text-white/40">
                    Built with
                    <a
                        class="text-white underline underline-offset-2"
                        href="https://aura-stack-auth.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @aura-stack/auth
                    </a>
                </span>
            </div>
            <div v-else class="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-white">Sign in to continue</h2>
                    <p class="mt-3 mb-6 text-sm text-white/40">Sign in with your GitHub, Gitlab or Bitbucket account.</p>
                    <div class="flex flex-col gap-y-2">
                        <Button
                            v-for="provider in ['Github', 'Gitlab', 'Bitbucket']"
                            :key="provider"
                            type="button"
                            class="w-full rounded-none"
                            variant="outline"
                            :disabled="isPending"
                            @click="signIn(provider.toLowerCase())"
                        >
                            Sign In with {{ provider }}
                        </Button>
                    </div>
                    <p class="my-5 relative">
                        <span class="w-full h-px block absolute top-1/2 bg-white/40" />
                        <span class="px-2 relative z-10 bg-black">Or continue with</span>
                    </p>
                    <form class="w-full text-start" @submit="handleSignInCredentials">
                        <div>
                            <label class="font-medium block" for="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                class="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                            />
                        </div>
                        <div class="mt-4">
                            <label class="font-medium block" for="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                class="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                            />
                        </div>
                        <Button class="w-full mt-6" variant="default" type="submit">Sign In</Button>
                    </form>
                </div>
                <span class="w-full h-px block bg-white/40" />
                <span class="block text-center text-white/40">
                    Built with
                    <a
                        class="text-white underline underline-offset-2"
                        href="https://aura-stack-auth.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @aura-stack/auth
                    </a>
                </span>
            </div>
        </section>
    </main>
</template>
