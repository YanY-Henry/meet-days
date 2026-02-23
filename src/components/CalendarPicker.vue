<template>
  <div class="wrap">
    <VCalendar
      :attributes="attrs"
      :initial-page="initialPage"
      is-expanded
      :first-day-of-week="0"
    >
      <template #day-content="{ day }">
        <button
          type="button"
          class="dayContent"
          :class="{ isMeet: isMeetDay(day?.id), isToday: isToday(day?.id) }"
          @click.stop="onDayCellClick(day)"
        >
          {{ isMeetDay(day?.id) ? "💝" : day?.day }}
        </button>
      </template>
    </VCalendar>
    <div class="hint muted">
      点击日期进行记录；出现 💝 表示这天见过面。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatYMD, isValidYMD, parseYMD } from "../lib/date";

const props = defineProps<{
  meetDates: string[];
}>();

const emit = defineEmits<{
  (e: "toggle", day: string): void;
}>();
const meetSet = computed(() => new Set(props.meetDates));
const todayYMD = formatYMD(new Date());
const initialPage = computed(() => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
});

function ymdToLocalDate(ymd: string): Date | null {
  if (!isValidYMD(ymd)) return null;
  const parsed = parseYMD(ymd);
  if (!parsed) return null;
  return new Date(parsed.y, parsed.m - 1, parsed.d);
}

const attrs = computed(() => [
  {
    key: "meet-days",
    highlight: {
      color: "pink",
      fillMode: "light",
    },
    // 使用本地 Date，避免 YYYY-MM-DD 被按 UTC 解析导致前一天高亮
    dates: props.meetDates
      .map((d) => ymdToLocalDate(d))
      .filter((d): d is Date => d instanceof Date),
  },
]);

function onDayCellClick(day: any) {
  const id = day?.id;
  if (typeof id === "string" && isValidYMD(id)) {
    emit("toggle", id);
    return;
  }

  const date = day?.date;
  if (date instanceof Date) emit("toggle", formatYMD(date));
}

function isMeetDay(id?: string) {
  return typeof id === "string" && meetSet.value.has(id);
}

function isToday(id?: string) {
  return typeof id === "string" && id === todayYMD;
}
</script>

<style scoped>
.wrap {
  display: grid;
  gap: 12px;
}

:deep(.vc-container) {
  --vc-accent-50: #fff1f5;
  --vc-accent-100: #ffe7ef;
  --vc-accent-200: #ffd4e1;
  --vc-accent-300: #ffbfd2;
  --vc-accent-400: #ff9eb9;
  --vc-accent-500: #f27998;
  --vc-accent-600: #e25b7f;
  --vc-accent-700: #c94267;
  --vc-accent-800: #a93656;
  --vc-accent-900: #892f47;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(160deg, #fffefe 0%, #fff7f6 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

:deep(.vc-title) {
  color: var(--text);
  font-weight: 600;
}

:deep(.vc-header) {
  padding: 4px 12px 10px;
  margin-bottom: 2px;
  height: 40px;
}

:deep(.vc-header .vc-title) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: linear-gradient(180deg, #fff9f9 0%, #fff3f5 100%);
  height: 36px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 700;
  line-height: 36px;
  color: var(--text);
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

:deep(.vc-header .vc-title:hover) {
  background: #ffeef3;
  border-color: #efc5d0;
  transform: translateY(-1px);
}

:deep(.vc-header .vc-arrow) {
  width: 36px;
  height: 36px;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(180deg, #fff9f9 0%, #fff3f5 100%);
  color: #b04b65;
  box-shadow: 0 2px 0 rgba(255, 255, 255, 0.8) inset;
  transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
}

:deep(.vc-header .vc-arrow:hover) {
  background: #ffeef3;
  border-color: #efc5d0;
  transform: translateY(-1px);
}

:deep(.vc-header .vc-arrow:focus-visible),
:deep(.vc-header .vc-title:focus-visible),
:deep(.vc-nav-title:focus-visible),
:deep(.vc-nav-arrow:focus-visible),
:deep(.vc-nav-item:focus-visible) {
  outline: 2px solid #d85a7b;
  outline-offset: 2px;
}

:deep(.vc-weekday) {
  color: var(--text-muted);
  font-size: 11px;
}

:deep(.vc-day-content:hover) {
  background: var(--primary-soft);
}

:deep(.vc-highlight-content-solid) {
  color: #fffafc;
}

:deep(.vc-highlight-content-light) {
  background: #ffeef3;
  color: #a6425f;
}

:deep(.vc-nav-popover-container) {
  margin-top: 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: linear-gradient(165deg, #fffdfd 0%, #fff3f6 100%);
  box-shadow: 0 18px 30px rgba(149, 66, 89, 0.2);
  z-index: 50;
}

:deep(.vc-nav-popover-caret) {
  display: none;
}

:deep(.vc-nav-header) {
  padding: 6px 6px 2px;
}

:deep(.vc-nav-items) {
  gap: 8px;
  padding: 6px;
}

:deep(.vc-nav-title),
:deep(.vc-nav-arrow),
:deep(.vc-nav-item) {
  border-radius: 12px;
}

:deep(.vc-nav-arrow) {
  border: 1px solid var(--line);
  color: #b04b65;
  background: #fff7f9;
}

:deep(.vc-nav-title) {
  font-weight: 700;
  color: var(--text);
  background: #fff7f9;
}

:deep(.vc-nav-item) {
  background: #ffeef3;
  border: 1px solid #f2ccd5;
  color: #8f4a5c;
  font-weight: 700;
}

:deep(.vc-nav-item:hover),
:deep(.vc-nav-arrow:hover),
:deep(.vc-nav-title:hover) {
  background: #ffe5ee;
}

:deep(.vc-nav-item.is-current) {
  color: #b24a64;
}

:deep(.vc-nav-item.is-active) {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff9fb;
}

.dayContent.isMeet {
  color: #b43f5f;
}

.dayContent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: inherit;
  border-radius: 8px;
  font-weight: 600;
  position: relative;
}

.dayContent.isToday {
  border-radius: 999px;
}

.dayContent.isToday::after {
  content: "";
  position: absolute;
  inset: 1px;
  border: 2px solid #d85a7b;
  border-radius: 999px;
  pointer-events: none;
}
.muted {
  color: var(--text-muted);
  font-size: 12px;
}
.hint {
  margin-top: 2px;
}
</style>
