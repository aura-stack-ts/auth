import { api } from "@/auth"
import { defineAction } from "astro:actions"
import { z } from "astro:schema"
import { navigate } from "astro:transitions/client"

export const server = {
    signIn: defineAction({
        accept: "form",
        input: z.object({
            provider: z.string(),
        }),
        handler: async (input, { request }) => {
            const value = await api.signIn(input.provider, { request, redirect: false })
            return value
        },
    }),
}
