<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVocabStore } from '@/stores/vocab'
import { useAsync } from '@/composables/useAsync'
import Icon from './Icon.vue'
import DictModal from './DictModal.vue'

const store = useVocabStore()
const router = useRouter()
const route = useRoute()

const showDictModal = ref(false)
const { execute } = useAsync()

const isAllDicts = computed(() => route.name === 'home')

const dictTabs = [
  { name: 'dictionary', label: 'Слова',       icon: 'book' },
  { name: 'study',      label: 'Flashcards',  icon: 'cards' },
  { name: 'statistics', label: 'Статистика',  icon: 'chart' },
]

onMounted(() => execute(() => store.fetchDicts()))

async function openDict(id) {
  store.setActiveDict(id)
  router.push({ name: 'dictionary' })
}

async function createDict(form) {
  await execute(() => store.createDict(form.name, form.emoji))
  showDictModal.value = false
  router.push({ name: 'dictionary' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <div class="logo-icon">
        <Icon name="book" :size="15" />
      </div>
      <div>
        <span class="logo-text">SVB</span>
        <span class="logo-sub">Vocab Builder</span>
      </div>
    </div>

    <div class="sidebar-sect">
      <button
        class="nav-item"
        :class="{ active: isAllDicts }"
        @click="router.push({ name: 'home' })"
      >
        <Icon name="layers" :size="15" />
        <span>Всі словники</span>
      </button>
    </div>

    <div class="sdiv" />

    <div class="sidebar-sect sidebar-scroll">
      <div class="sidebar-lbl">Словники</div>

      <button
        v-for="d in store.dicts"
        :key="d.id"
        class="dict-entry"
        :class="{ active: store.activeDictId === d.id && !isAllDicts }"
        @click="openDict(d.id)"
      >
        <span class="dict-emoji">{{ d.emoji ?? '📘' }}</span>
        <span class="dict-nm">{{ d.name }}</span>
        <span class="dict-cnt">{{ d.wordCount ?? '' }}</span>
      </button>

      <button class="sb-add" @click="showDictModal = true">
        <Icon name="plus" :size="13" />
        <span>Новий словник</span>
      </button>
    </div>

    <template v-if="!isAllDicts && store.activeDict">
      <div class="sdiv" />
      <div class="sidebar-sect">
        <div class="sidebar-lbl">Розділи</div>
        <button
          v-for="tab in dictTabs"
          :key="tab.name"
          class="nav-item"
          :class="{ active: route.name === tab.name }"
          @click="router.push({ name: tab.name })"
        >
          <Icon :name="tab.icon" :size="15" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.name === 'study' && store.totalDue > 0" class="badge">
            {{ store.totalDue }}
          </span>
        </button>
      </div>
    </template>
  </aside>

  <DictModal v-if="showDictModal" @save="createDict" @close="showDictModal = false" />
</template>
