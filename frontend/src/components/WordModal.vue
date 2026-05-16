<script setup>
import { reactive } from 'vue'
import AppModal from './AppModal.vue'
import Icon from './Icon.vue'

const props = defineProps({
  word: { type: Object, default: null },
})
const emit = defineEmits(['save', 'close'])

const form = reactive({
  term: props.word?.term ?? '',
  translation: props.word?.translation ?? '',
  example: props.word?.example ?? '',
  notes: props.word?.notes ?? '',
})

const isValid = () => form.term.trim() && form.translation.trim()

function submit() {
  if (!isValid()) return
  emit('save', { ...form })
}
</script>

<template>
  <AppModal :title="word ? 'Редагувати слово' : 'Нове слово'" @close="emit('close')">
    <div class="frow">
      <div class="fg">
        <label>Слово *</label>
        <input v-model="form.term" placeholder="ephemeral" autofocus />
      </div>
      <div class="fg">
        <label>Переклад *</label>
        <input v-model="form.translation" placeholder="скороминущий" />
      </div>
    </div>

    <div class="fg">
      <label>Приклад використання</label>
      <input v-model="form.example" placeholder="The ephemeral beauty of..." />
    </div>

    <div class="fg">
      <label>Нотатки</label>
      <textarea v-model="form.notes" placeholder="Мнемоніка, контекст..." />
    </div>

    <template #actions>
      <button class="btn btn-ghost" @click="emit('close')">Скасувати</button>
      <button class="btn btn-primary" :disabled="!isValid()" @click="submit">
        <Icon name="check" :size="14" /> Зберегти
      </button>
    </template>
  </AppModal>
</template>
