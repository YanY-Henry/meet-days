<template>
  <div class="wrap">
    <div class="legend">
      <span class="muted">在想你</span>
      <span class="box off"></span>
      <span class="box on"></span>
      <span class="muted">在见你</span>
    </div>

    <div class="heatmapFrame" :class="{ mirrored: isMirrored }">
      <div class="weekdays" aria-hidden="true">
        <span v-for="w in weekLabels" :key="w">{{ w }}</span>
      </div>

      <div class="scrollArea">
        <div class="months" aria-hidden="true">
          <span
            v-for="(m, i) in monthColumns"
            :key="`m-${i}`"
            class="month"
          >
            {{ m }}
          </span>
        </div>

        <div class="grid" role="grid" aria-label="最近365天见面热力图">
          <template v-for="(day, i) in paddedDays" :key="day ?? `empty-${i}`">
            <button
              v-if="day"
              class="cell"
              :class="{ on: meetSet.has(day) }"
              :aria-label="titleText(day)"
              :aria-pressed="meetSet.has(day)"
              @mouseenter="showTooltip($event, day)"
              @mousemove="showTooltip($event, day)"
              @mouseleave="hideTooltip"
              @focus="showTooltip($event, day)"
              @blur="hideTooltip"
              @click="toggle(day)"
            />
            <span v-else class="cell empty" aria-hidden="true"></span>
          </template>
        </div>
      </div>

      <div
        v-if="tooltip.visible"
        class="floatingTip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        role="tooltip"
      >
        {{ tooltip.text }}
      </div>
    </div>

    <div class="hint muted">
      点击方块，记录见面日期（与下方日历自动同步）。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { formatYMD, lastNDays } from "../lib/date";

const props = defineProps<{
  meetDates: string[];
  year?: number | null;
}>();

const emit = defineEmits<{
  (e: "toggle", day: string): void;
}>();

const days = computed(() => {
  if (typeof props.year === "number" && Number.isFinite(props.year)) {
    return daysOfYear(props.year);
  }
  return lastNDays(365); // 从旧到新
});
const paddedDays = computed(() => {
  const d = days.value;
  if (!d.length) return [] as Array<string | null>;
  const leading = weekdayIndexMonFirst(d[0] ?? "");
  return [...Array(leading).fill(null), ...d];
});
const isMirrored = computed(() => props.year == null);

const monthColumns = computed(() => {
  const labels: string[] = [];
  const source = paddedDays.value;
  let lastMonth = "";
  for (let i = 0; i < source.length; i += 7) {
    const week = source.slice(i, i + 7);
    const firstDay = week.find((x): x is string => typeof x === "string");
    if (!firstDay) {
      labels.push("");
      continue;
    }
    const date = toLocalDate(firstDay);
    if (!date) {
      labels.push("");
      continue;
    }
    const current = monthLabel(date);
    if (i === 0 || current !== lastMonth) labels.push(current);
    else labels.push("");
    lastMonth = current;
  }

  // 仅在“最近365天镜像模式”处理：如果最早月份标签在镜像视图最右侧，则隐藏。
  if (!isMirrored.value) return labels;

  const earliestDay = days.value[0];
  const earliestDate = earliestDay ? toLocalDate(earliestDay) : null;
  if (!earliestDate) return labels;

  const earliestMonth = monthLabel(earliestDate);
  const earliestLabelIndex = labels.findIndex((m) => m === earliestMonth);
  const visualRightmostIndexInMirrored = 0;

  if (earliestLabelIndex === visualRightmostIndexInMirrored) {
    labels[earliestLabelIndex] = "";
  }

  return labels;
});

const meetSet = computed(() => new Set(props.meetDates));
const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  text: "",
});

function toggle(day: string) {
  emit("toggle", day);
}

function toLocalDate(ymd: string): Date | null {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysOfYear(year: number): string[] {
  const out: string[] = [];
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    out.push(formatYMD(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function weekdayIndexMonFirst(ymd: string): number {
  const date = toLocalDate(ymd);
  if (!date) return 0;
  return (date.getDay() + 6) % 7;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function weekdayLabel(ymd: string) {
  const date = toLocalDate(ymd);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function titleText(day: string) {
  const week = weekdayLabel(day);
  return meetSet.value.has(day)
    ? `${day} (${week}) · 已见面 💝`
    : `${day} (${week}) · 未见面 💝`;
}

function showTooltip(e: MouseEvent | FocusEvent, day: string) {
  const target = e.currentTarget as HTMLElement | null;
  const frame = target?.closest(".heatmapFrame") as HTMLElement | null;
  if (!target || !frame) return;

  const t = target.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  tooltip.text = titleText(day);
  tooltip.x = t.left - f.left + t.width / 2;
  tooltip.y = t.top - f.top - 10;
  tooltip.visible = true;
}

function hideTooltip() {
  tooltip.visible = false;
}
</script>

<style scoped>
.wrap {
  display: grid;
  gap: 12px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  width: fit-content;
}
.muted {
  color: var(--text-muted);
  font-size: 12px;
}
.box {
  width: 11px;
  height: 11px;
  border-radius: 4px;
  border: 1px solid var(--line);
}
.box.off {
  background: #fbe6ea;
}
.box.on {
  background: var(--primary);
  border-color: var(--primary);
}

.heatmapFrame {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
  position: relative;
  z-index: 20;
  min-width: 0;
}

.weekdays {
  margin-top: 20px;
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 4px;
}

.weekdays span {
  font-size: 10px;
  line-height: 13px;
  color: var(--text-muted);
}

.scrollArea {
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-gutter: stable;
  min-width: 0;
}

.months {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 13px;
  gap: 4px;
  margin-bottom: 6px;
  min-width: max-content;
}

.month {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  font-weight: 600;
}

/* GitHub 风格：7 行（周一到周日）× 53 列（周）= 371 格，365天只用其中 365 格 */
.grid {
  display: grid;
  grid-auto-flow: column;     /* 关键：按列填充 */
  grid-template-rows: repeat(7, 13px);
  grid-auto-columns: 13px;
  gap: 4px;
  align-items: start;
  min-width: max-content;
}

.cell {
  width: 13px;
  height: 13px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: #fbe6ea;
  cursor: pointer;
  padding: 0;
  transition: transform 0.12s ease, background-color 0.12s ease;
  position: relative;
}

.floatingTip {
  position: absolute;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  pointer-events: none;
  background: #6a3440;
  color: #fff8fa;
  font-size: 11px;
  line-height: 1.2;
  padding: 6px 9px;
  border-radius: 8px;
  z-index: 9999;
  box-shadow: 0 10px 24px rgba(106, 52, 64, 0.35);
}

.cell.empty {
  border-color: transparent;
  background: transparent;
}

.cell.on {
  background: var(--primary);
  border-color: var(--primary);
}
.cell:hover {
  transform: translateY(-1px);
}
.cell:focus-visible {
  outline: 2px solid #9d3d53;
  outline-offset: 2px;
}

.hint {
  margin-top: 4px;
}

.heatmapFrame.mirrored .months {
  transform: scaleX(-1);
  transform-origin: center;
}

.heatmapFrame.mirrored .month {
  transform: scaleX(-1);
}

.heatmapFrame.mirrored .grid {
  transform: scaleX(-1);
  transform-origin: center;
}

.heatmapFrame.mirrored .cell {
  transform: scaleX(-1);
}

.heatmapFrame.mirrored .cell:hover {
  transform: scaleX(-1) translateY(-1px);
}

@media (max-width: 640px) {
  .heatmapFrame {
    grid-template-columns: 32px minmax(0, 1fr);
  }
  .weekdays span {
    font-size: 9px;
  }
}
</style>
