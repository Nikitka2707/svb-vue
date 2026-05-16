<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useVocabStore } from '@/stores/vocab'
import { useAsync } from '@/composables/useAsync'
import { LEVEL_LABELS, wordLevel } from '@/utils/sm2'
import Icon from '@/components/Icon.vue'
import WordModal from '@/components/WordModal.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useVocabStore()
const modal = ref(null) // null | 'add' | word object
const search = ref('')
const filter = ref('all')

const { loading, error, execute, clearError } = useAsync()
const saveAsync = useAsync()

const dict = computed(() => store.activeDict)

// Завантаження слів при зміні активного словника
watch(
  () => dict.value?.id,
  async (id) => {
    if (id) await execute(() => store.fetchWords(id))
  },
  { immediate: true },
)

const filteredWords = computed(() => {
  const q = search.value.toLowerCase()
  return store.words.filter((w) => {
    const matchSearch =
      !q || w.term.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
    const matchFilter = filter.value === 'all' || wordLevel(w) === filter.value
    return matchSearch && matchFilter
  })
})

async function saveWord(form) {
  if (!dict.value) return
  await saveAsync.execute(async () => {
    if (modal.value?.id) {
      await store.updateWord(modal.value.id, form)
    } else {
      await store.addWord(dict.value.id, form)
    }
  })
  if (!saveAsync.error.value) modal.value = null
}

async function deleteWord(wordId) {
  if (!confirm('Видалити слово?')) return
  await execute(() => store.deleteWord(wordId))
}
</script>

<template>
  <div class="page">
    <template v-if="dict">
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">{{ dict.emoji ?? '📘' }} {{ dict.name }}</h1>
            <p class="page-sub">{{ store.words.length }} слів</p>
          </div>
          <button class="btn btn-primary" @click="modal = 'add'">
            <Icon name="plus" :size="14" /> Додати слово
          </button>
        </div>
      </div>

      <ErrorBanner :message="error || saveAsync.error.value" @close="clearError(); saveAsync.clearError()" />

      <div class="filter-row">
        <div class="sw">
          <span class="sw-ic"><Icon name="search" :size="13" /></span>
          <input v-model="search" placeholder="Пошук..." />
        </div>
        <select v-model="filter">
          <option value="all">Всі</option>
          <option value="new">Нові</option>
          <option value="learning">Вчу</option>
          <option value="review">Повторення</option>
          <option value="mastered">Вивчено</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading" />

      <template v-else>
        <div v-if="filteredWords.length === 0" class="empty">
          <div style="font-size: 38px; margin-bottom: 7px">📭</div>
          <h3>{{ store.words.length === 0 ? 'Словник порожній' : 'Нічого не знайдено' }}</h3>
          <p style="margin-bottom: 13px">
            {{ store.words.length === 0 ? 'Додайте перше слово' : 'Спробуйте інший фільтр' }}
          </p>
          <button v-if="store.words.length === 0" class="btn btn-primary" @click="modal = 'add'">
            <Icon name="plus" :size="14" /> Додати слово
          </button>
        </div>

        <div v-else class="word-list">
          <div v-for="w in filteredWords" :key="w.id" class="word-item">
            <div style="flex: 1; min-width: 0">
              <div class="word-row">
                <span class="wterm">{{ w.term }}</span>
                <span class="wtrans">{{ w.translation }}</span>
              </div>
              <div v-if="w.example" class="wex">"{{ w.example }}"</div>
            </div>
            <div class="wmeta">
              <span class="lb" :class="`l-${wordLevel(w)}`">{{ LEVEL_LABELS[wordLevel(w)] }}</span>
              <button class="btn btn-ghost btn-sm" @click="modal = w">
                <Icon name="edit" :size="12" />
              </button>
              <button class="btn btn-danger btn-sm" @click="deleteWord(w.id)">
                <Icon name="trash" :size="12" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>

    <div v-else class="empty">
      <h3>Виберіть словник</h3>
      <p>Виберіть або створіть словник у меню ліворуч</p>
    </div>

    <WordModal
      v-if="modal"
      :word="modal === 'add' ? null : modal"
      @save="saveWord"
      @close="modal = null"
    />
  </div>
</template>
