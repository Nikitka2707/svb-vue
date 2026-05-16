<script setup>
import { ref } from 'vue'
import AppModal from './AppModal.vue'
import Icon from './Icon.vue'

const props = defineProps({
  dict: { type: Object, default: null },
})
const emit = defineEmits(['save', 'close'])

const EMOJIS = ['📘', '📗', '📙', '📕', '🔤', '🌍', '💬', '🎓', '✨', '🧠', '🔥', '💡', '📝', '🎯', '🌱', '⚡']

const name = ref(props.dict?.name ?? '')
const emoji = ref(props.dict?.emoji ?? '📘')

function submit() {
  if (!name.value.trim()) return
  emit('save', { name: name.value.trim(), emoji: emoji.value })
}
</script>

<template>
  <AppModal :title="dict ? 'Редагувати словник' : 'Новий словник'" @close="emit('close')">
    <div class="fg">
      <label>Назва *</label>
      <input v-model="name" placeholder="Англійська B2" autofocus @keyup.enter="submit" />
    </div>

    <div class="fg">
      <label>Іконка</label>
      <div class="eprow">
        <button
          v-for="e in EMOJIS"
          :key="e"
          class="ep"
          :class="{ s: emoji === e }"
          @click="emoji = e"
        >
          {{ e }}
        </button>
      </div>
    </div>

    <template #actions>
      <button class="btn btn-ghost" @click="emit('close')">Скасувати</button>
      <button class="btn btn-primary" :disabled="!name.trim()" @click="submit">
        <Icon name="check" :size="14" /> Зберегти
      </button>
    </template>
  </AppModal>
</template>
