<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabStore } from '@/stores/vocab'
import { useAsync } from '@/composables/useAsync'
import Icon from '@/components/Icon.vue'
import DictModal from '@/components/DictModal.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useVocabStore()
const router = useRouter()

const modal = ref(null) // null | 'new' | dict object
const { loading, error, execute, clearError } = useAsync()

onMounted(() =>
  execute(async () => {
    await store.fetchDicts()
    // Завантажуємо кількість слів для кожного словника
    await store.fetchAllWordCounts()
  }),
)

async function saveDict(form) {
  await execute(async () => {
    if (modal.value && modal.value.id) {
      await store.updateDict(modal.value.id, form.name, form.emoji)
    } else {
      await store.createDict(form.name, form.emoji)
    }
  })
  modal.value = null
}

async function deleteDict(id) {
  if (!confirm('Видалити словник разом з усіма словами?')) return
  await execute(() => store.deleteDict(id))
}

function openDict(id) {
  store.setActiveDict(id)
  router.push({ name: 'dictionary' })
}

const totalWords = () => store.dicts.reduce((a, d) => a + (d.wordCount ?? 0), 0)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Всі словники</h1>
          <p class="page-sub">{{ store.dicts.length }} словників · {{ totalWords() }} слів загалом</p>
        </div>
        <button class="btn btn-primary" @click="modal = 'new'">
          <Icon name="plus" :size="14" /> Новий словник
        </button>
      </div>
    </div>

    <ErrorBanner :message="error" @close="clearError" />

    <LoadingSpinner v-if="loading && store.dicts.length === 0" />

    <div v-else class="dict-grid">
      <div
        v-for="d in store.dicts"
        :key="d.id"
        class="dict-card"
        :class="{ act: store.activeDictId === d.id }"
        @click="openDict(d.id)"
      >
        <div class="dc-actions" @click.stop>
          <button class="btn btn-ghost btn-sm" @click="modal = d">
            <Icon name="edit" :size="12" />
          </button>
          <button class="btn btn-danger btn-sm" @click="deleteDict(d.id)">
            <Icon name="trash" :size="12" />
          </button>
        </div>

        <div v-if="store.activeDictId === d.id" class="dc-active-label">✓ Активний</div>
        <div class="dc-emoji">{{ d.emoji ?? '📘' }}</div>
        <div class="dc-name">{{ d.name }}</div>
        <div class="dc-meta">{{ d.wordCount ?? 0 }} слів</div>
      </div>
    </div>

    <DictModal
      v-if="modal"
      :dict="modal === 'new' ? null : modal"
      @save="saveDict"
      @close="modal = null"
    />
  </div>
</template>
