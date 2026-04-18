<script setup lang="ts">
import Button from "~/components/ui/button/Button.vue"

const props = defineProps<{
    action: (formData: FormData) => void | Promise<void>
}>()

const isOpen = ref(false)

const updateSession = async (event: Event) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    await props.action(formData)
    isOpen.value = false
}
</script>

<template>
    <section>
        <div class="mt-4 pt-4 flex items-center justify-between gap-x-4 border-t">
            <div>
                <label class="font-medium block" for="signout">Edit Profile</label>
                <span class="text-sm">Edit your profile information</span>
            </div>
            <Button class="w-20 data-[open='true']:hidden" variant="secondary" :data-open="isOpen" @click="isOpen = true">
                Edit
            </Button>
        </div>
        <form v-if="isOpen" class="w-full mt-4 pt-4 text-start border-t" @submit="updateSession">
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
                <label class="font-medium block" for="email">Email</label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    class="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                />
            </div>
            <div class="grid grid-cols-2 gap-x-4">
                <Button class="w-full mt-6" variant="default" type="submit">Edit</Button>
                <Button class="w-full mt-6" variant="secondary" type="button" @click="isOpen = false">Cancel</Button>
            </div>
        </form>
    </section>
</template>
