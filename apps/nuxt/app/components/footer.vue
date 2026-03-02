<script setup lang="ts">
import { GithubIcon } from "lucide-vue-next"

const community = [
    {
        title: "Discord Support",
        href: "https://discord.com/invite/anXExMR5",
    },
]

const resources = [
    {
        title: "Documentation",
        href: "https://aura-stack-auth.vercel.app/docs",
    },
    {
        title: "GitHub Repository",
        href: "https://github.com/aura-stack-ts/auth",
    },
    {
        title: "NPM Registry",
        href: "https://npmjs.com/package/@aura-stack/auth",
    },
]

const socialLinks = [
    {
        icon: GithubIcon,
        href: "https://github.com/aura-stack-ts/auth",
    },
]
</script>

<template>
    <footer class="relative border-t bg-black">
        <div class="w-11/12 mx-auto max-w-5xl border-x">
            <div class="max-w-5xl py-10 px-6 grid grid-cols-6 gap-6">
                <div class="col-span-6 flex flex-col gap-5 md:col-span-4">
                    <a href="" class="w-max opacity-25">Aura Auth</a>
                    <p class="max-w-sm text-muted-foreground font-mono text-sm text-balance">
                        Built for speed, security, and developer experience. The complete authentication library for TypeScript
                        applications.
                    </p>
                    <div class="flex gap-2">
                        <a
                            v-for="item in socialLinks"
                            :key="item.href"
                            :href="item.href"
                            target="_blank"
                            class="p-1.5 border rounded-md hover:bg-accent"
                        >
                            <component :is="item.icon" class="h-4 w-4" />
                        </a>
                    </div>
                </div>
                <div class="col-span-3 w-full base:col-span-1">
                    <span class="mb-1 text-sm">Resources</span>
                    <ul class="flex flex-col gap-1">
                        <li v-for="item in resources" :key="item.href">
                            <a :href="item.href" class="w-max py-1 text-xs text-muted-foreground duration-200 hover:underline">
                                {{ item.title }}
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="col-span-3 w-full base:col-span-1">
                    <span class="mb-1 text-sm">Community</span>
                    <ul class="flex flex-col gap-1">
                        <li v-for="item in community" :key="item.href">
                            <a :href="item.href" class="w-max py-1 text-xs text-muted-foreground duration-200 hover:underline">
                                {{ item.title }}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="w-full h-px absolute inset-x-0 bg-border" />
            <div class="max-w-5xl py-4 flex flex-col justify-between gap-2">
                <p class="text-sm text-muted-foreground text-center font-thin">
                    © <a href="https://github.com/aura-stack-ts">Aura Stack Labs</a>. All rights reserved {year}
                </p>
            </div>
        </div>
    </footer>
</template>
