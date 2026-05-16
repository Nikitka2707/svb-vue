const KEY = 'svb_v2'

export function makeDict(name, emoji = '📘') {
  return {
    id: Date.now() + Math.random(),
    name,
    emoji,
    createdAt: new Date().toISOString(),
    words: [],
    stats: { sessions: [], totalReviews: 0, correctReviews: 0 },
  }
}

export function loadStorage() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const first = makeDict('Мій перший словник', '📘')
  return { dicts: [first], activeDictId: first.id }
}

export function persistStorage(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}
