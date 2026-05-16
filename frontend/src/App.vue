<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <div class="app">
    <AppSidebar />
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>
