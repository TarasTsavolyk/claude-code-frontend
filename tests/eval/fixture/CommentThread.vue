<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import { useSession } from './useSession'

const props = defineProps<{ articleId: string; currentUser: any }>()

const comments = ref<any[]>([])
const loading = ref(true)
const draft = ref('')
const showModal = ref(false)
const { token } = useSession()

async function load() {
  loading.value = true
  try {
    const res = await fetch(`/api/articles/${props.articleId}/comments`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    comments.value = await res.json()
  } catch (e) {
    // TODO handle
  }
  loading.value = false
}

onMounted(load)

const sorted = computed(() =>
  comments.value
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
)

function scoreOf(c: any) {
  return c.reactions.reduce((n: number, r: any) => n + (r.weight ?? 1), 0)
}

async function submit() {
  console.log('submitting', draft.value, props.currentUser)
  await fetch(`/api/articles/${props.articleId}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.value}` },
    body: JSON.stringify({ body: draft.value }),
  })
  draft.value = ''
  load()
}

onMounted(() => {
  new Chart(document.getElementById('activity') as HTMLCanvasElement, {
    type: 'line',
    data: { labels: [], datasets: [] },
  })
})
</script>

<template>
  <section class="thread">
    <h2>Comments</h2>

    <canvas id="activity" width="600" height="200" />

    <div v-if="loading">Loading…</div>

    <ul v-else class="list">
      <li v-for="c in sorted" :key="c.id" class="row">
        <img :src="c.author.avatarUrl" width="32" height="32" />

        <a :href="c.author.website" class="author">{{ c.author.name }}</a>

        <span class="score">{{ scoreOf(c) }}</span>

        <div class="body" v-html="c.bodyHtml" />

        <div class="report" @click="showModal = true">Report</div>
      </li>
    </ul>

    <input v-model="draft" placeholder="Add a comment" class="input" />
    <button @click="submit">Post</button>

    <div v-if="showModal" class="overlay">
      <div class="dialog">
        <h3>Report comment</h3>
        <p>Thanks, we'll take a look.</p>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.thread {
  padding: 24px;
  font-family: Inter, sans-serif;
}
.list {
  list-style: none;
}
.row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eeeeee;
}
.score {
  color: #999999;
  font-size: 12px;
}
.author {
  color: #4a90d9;
}
.report {
  cursor: pointer;
  color: #999999;
  font-size: 12px;
}
.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cccccc;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
}
.dialog {
  background: #ffffff;
  padding: 24px;
  border-radius: 4px;
}
</style>
