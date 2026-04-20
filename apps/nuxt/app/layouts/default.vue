<script setup lang="ts">
import Header from "~/components/header.vue"
</script>

<template>
    <div class="w-full min-h-dvh flex flex-col">
        <Header />
        <slot />
    </div>
</template>
