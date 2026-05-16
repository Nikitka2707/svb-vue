<script setup>
defineProps({
  message: { type: String, default: null },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Transition name="banner">
    <div v-if="message" class="error-banner">
      <span>⚠ {{ message }}</span>
      <button class="banner-close" @click="emit('close')">✕</button>
    </div>
  </Transition>
</template>

<style scoped>
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
  margin-bottom: 16px;
}

.banner-close {
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.7;
  flex-shrink: 0;
}

.banner-close:hover {
  opacity: 1;
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.2s;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
