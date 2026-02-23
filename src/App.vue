<template>
  <div class="app">
    <div v-if="showAccessModal" class="accessOverlay">
      <section class="accessModal">
        <h2>进入纪念册</h2>
        <p class="accessDesc">输入共享密码可开启云端同步；也可继续本地模式。</p>
        <input
          v-model="accessInput"
          type="password"
          placeholder="输入共享密码"
          class="accessInput"
          @keydown.enter="unlockSync"
        />
        <div v-if="accessError" class="accessError">{{ accessError }}</div>
        <div class="accessActions">
          <button type="button" class="btn primary" @click="unlockSync">开启同步</button>
          <button type="button" class="btn ghost" @click="chooseReadOnly">只读模式</button>
        </div>
      </section>
    </div>

    <header class="header">
      <p class="eyebrow">Our Little Timeline</p>
      <h1>恋爱见面纪念册</h1>
      <p class="sub">点选日期，记录每一次见面的心动时刻。</p>
      <p class="modeTag">{{ modeText }}</p>
    </header>

    <main class="grid">
      <section class="card board">
        <div class="heatmapZone">
          <div class="sectionHead">
            <h2 class="sectionTitle">{{ heatmapTitle }}</h2>
            <select v-model="heatmapRange" class="rangeSelect">
              <option value="recent">最近 365 天</option>
              <option v-for="y in heatmapYears" :key="`heat-${y}`" :value="String(y)">
                {{ y }} 年
              </option>
            </select>
          </div>
          <Heatmap365 :meetDates="meetDates" :year="heatmapYear" @toggle="toggleDay" />
        </div>

        <div class="bottomZone">
          <div class="calendarZone">
            <h2 class="sectionTitle">心动日历</h2>
            <CalendarPicker :meetDates="meetDates" @toggle="toggleDay" />
          </div>

          <aside class="statsZone">
            <h2 class="sectionTitle">见面统计</h2>
            <StatsPanel :meetDates="meetDates" />
          </aside>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  loadMeetDates,
  saveMeetDates,
  pullMeetDatesRemote,
  pushMeetDatesRemote,
} from "./lib/storage";
import { extractYears } from "./lib/stats";
import Heatmap365 from "./components/Heatmap365.vue";
import CalendarPicker from "./components/CalendarPicker.vue";
import StatsPanel from "./components/StatsPanel.vue";

const meetDates = ref<string[]>([]);
const heatmapRange = ref("recent");
let syncTimer: number | null = null;
const ACCESS_PASSWORD = (import.meta.env.VITE_ACCESS_PASSWORD as string | undefined)?.trim();
const showAccessModal = ref(true);
const accessInput = ref("");
const accessError = ref("");
const mode = ref<"sync" | "readonly" | null>(null);

const heatmapYears = computed(() => {
  const years = extractYears(meetDates.value);
  const current = new Date().getFullYear();
  if (!years.includes(current)) years.unshift(current);
  return years;
});

const heatmapYear = computed<number | null>(() => {
  if (heatmapRange.value === "recent") return null;
  const y = Number(heatmapRange.value);
  return Number.isFinite(y) ? y : null;
});

const heatmapTitle = computed(() =>
  heatmapYear.value ? `${heatmapYear.value} 年见面热力图` : "最近 365 天见面热力图"
);
const modeText = computed(() => {
  if (mode.value === "sync") return "当前模式：云端同步";
  if (mode.value === "readonly") return "当前模式：只读";
  return "请选择进入模式";
});

onMounted(() => {
  meetDates.value = loadMeetDates();
});

watch(
  meetDates,
  (v) => {
    saveMeetDates(v);
    if (mode.value !== "sync") return;
    if (syncTimer !== null) window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => {
      void pushMeetDatesRemote(v);
    }, 600);
  },
  { deep: true }
);

function toggleDay(day: string) {
  if (mode.value === "readonly" || mode.value === null) return;
  const idx = meetDates.value.indexOf(day);
  if (idx >= 0) meetDates.value.splice(idx, 1);
  else meetDates.value.push(day);
  meetDates.value.sort();
}

async function enableSyncMode() {
  mode.value = "sync";
  showAccessModal.value = false;
  accessError.value = "";

  const remote = await pullMeetDatesRemote();
  if (!remote) return;

  const merged = Array.from(new Set([...meetDates.value, ...remote])).sort();
  meetDates.value = merged;
  saveMeetDates(merged);
  void pushMeetDatesRemote(merged);
}

function chooseReadOnly() {
  mode.value = "readonly";
  showAccessModal.value = false;
  accessError.value = "";
  void (async () => {
    const remote = await pullMeetDatesRemote();
    if (!remote) return;
    const merged = Array.from(new Set([...meetDates.value, ...remote])).sort();
    meetDates.value = merged;
    saveMeetDates(merged);
  })();
}

function unlockSync() {
  const pass = accessInput.value.trim();
  if (!ACCESS_PASSWORD) {
    accessError.value = "未配置同步密码，请先设置 VITE_ACCESS_PASSWORD。";
    return;
  }
  if (pass !== ACCESS_PASSWORD) {
    accessError.value = "密码不正确，请重试。";
    return;
  }
  void enableSyncMode();
}
</script>

<style scoped>
.app {
  max-width: 1080px;
  margin: 0 auto;
  padding: 34px 20px 44px;
}

.accessOverlay {
  position: fixed;
  inset: 0;
  background: rgba(58, 37, 41, 0.24);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 16px;
}

.accessModal {
  width: min(480px, 100%);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.accessModal h2 {
  margin: 0 0 6px;
  font-size: 22px;
}

.accessDesc {
  margin: 0 0 12px;
  color: var(--text-muted);
  font-size: 13px;
}

.accessInput {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text);
  background: var(--surface-2);
}

.accessError {
  margin-top: 8px;
  color: #b44661;
  font-size: 12px;
}

.accessActions {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.btn {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.btn.ghost {
  background: transparent;
}

.header {
  position: relative;
  padding: 18px 20px 4px;
  border-radius: 22px;
  background: linear-gradient(130deg, #fff8f7 15%, #ffeef2 70%, #ffecdf 100%);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.header h1 {
  margin: 0;
  font-size: 36px;
  letter-spacing: 0.03em;
  color: var(--text);
}
.sub {
  margin: 8px 0 6px;
  max-width: 640px;
  color: var(--text-muted);
}
.modeTag {
  margin: 2px 0 6px;
  font-size: 12px;
  color: #a14a61;
}
.grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr;
}

.board {
  --board-max-width: 980px;
  display: grid;
  gap: 22px;
  padding: 22px;
  max-width: var(--board-max-width);
  width: 100%;
  margin: 0 auto;
}

.heatmapZone {
  display: grid;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.bottomZone {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

.calendarZone,
.statsZone {
  display: grid;
  gap: 10px;
}

@media (min-width: 900px) {
  .app {
    max-width: 1040px;
  }
  .board {
    --board-max-width: 1040px;
  }
  .bottomZone {
    grid-template-columns: minmax(0, 1.25fr) minmax(600px, 0.75fr);
    gap: 22px;
  }
}
.card {
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 20px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.sectionTitle {
  margin: 0 0 14px;
  font-size: 18px;
  color: var(--text);
}

.sectionHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rangeSelect {
  border-radius: 999px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 767px) {
  .app {
    padding: 18px 14px 30px;
  }
  .header {
    border-radius: 16px;
    padding: 14px 14px 2px;
  }
  .header h1 {
    font-size: 30px;
  }
  .card {
    padding: 14px;
    border-radius: 14px;
  }
  .board {
    gap: 16px;
  }
  .heatmapZone {
    padding-bottom: 14px;
  }
  .sectionTitle {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .sectionHead {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .rangeSelect {
    width: 100%;
    border-radius: 12px;
  }
}
</style>
