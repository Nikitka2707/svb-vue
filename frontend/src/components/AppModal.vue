<script setup>
import Icon from './Icon.vue'

defineProps({
  title: { type: String, required: true },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ title }}</span>
          <button class="btn btn-ghost btn-sm" @click="emit('close')">
            <Icon name="x" :size="13" />
          </button>
        </div>

        <slot />

        <div v-if="$slots.actions" class="modal-actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
