<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <div class="fixed inset-0 -z-10 h-full w-full bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat">
    <div class="absolute inset-0 bg-zinc-950/80"></div>
  </div>
  <Toast position="top-center" />
  <ConfirmDialog />
  <RouterView />
</template>

<style scoped></style>
