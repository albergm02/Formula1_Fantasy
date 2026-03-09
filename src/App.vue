<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <Toast position="top-center" />
  <ConfirmDialog />
  <RouterView />
</template>

<style scoped></style>
