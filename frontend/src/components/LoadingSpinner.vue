<script setup>
defineProps({
  text: { type: String, default: 'Завантаження...' },
})
</script>

<template>
  <div class="spinner-wrap">
    <div class="spinner" />
    <span class="spinner-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text3);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--bg4);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner-text {
  font-size: 13px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
