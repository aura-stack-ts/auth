<script setup lang="ts">
import Header from "~/components/header.vue"
import Footer from "~/components/footer.vue"
</script>

<template>
    <div class="w-full min-h-dvh flex flex-col justify-between">
        <Header />
        <slot />
        <Footer />
    </div>
</template>
