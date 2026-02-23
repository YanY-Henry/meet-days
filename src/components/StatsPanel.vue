<template>
  <div class="wrap">
    <div class="leftCol">
      <div class="block hero">
        <div class="label">恋爱期见面频率（自 2025-10-11）</div>
        <div class="big">{{ percent(rSince) }}</div>
      </div>

      <div class="metricGrid">
        <div class="block mini metric365">
          <div class="label">最近 365 天</div>
          <div class="value">{{ percent(r365) }}</div>
        </div>
        <div class="block mini metric30">
          <div class="label">最近 30 天</div>
          <div class="value">{{ percent(r30) }}</div>
        </div>
        <div class="block mini streakNow">
          <div class="label">当前连续</div>
          <div class="value">{{ streakNow }} 天</div>
        </div>
        <div class="block mini streakBest">
          <div class="label">历史最长连续</div>
          <div class="value">{{ streakBest }} 天</div>
        </div>
      </div>
    </div>

    <div class="rightCol">
      <div class="block yearBlock">
        <div class="row">
          <div class="label">年度频率</div>
          <select v-model.number="year">
            <option v-for="y in years" :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </div>
        <div class="big">{{ percent(rYear) }}</div>
      </div>

      <div class="block monthBlock">
        <div class="row">
          <div class="label">月度频率</div>

          <div class="monthControls">
            <select v-model.number="monthYear">
              <option v-for="y in years" :key="`month-${y}`" :value="y">
                {{ y }} 年
              </option>
            </select>
            <select v-model.number="month">
              <option v-for="m in 12" :key="m" :value="m">
                {{ m }} 月
              </option>
            </select>
          </div>
        </div>
        <div class="big">{{ percent(rMonth) }}</div>
      </div>

      <div class="block durationBlock">
        <div class="durationRow">
          <div class="label">总共见面时长</div>
          <div class="big">{{ totalDuration }} 天</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ratioLast365,
  ratioLast30,
  ratioYear,
  ratioMonth,
  extractYears,
  ratioSince,
  currentStreak,
  longestStreak,
  totalMeetDurationDays,
} from "../lib/stats";

const props = defineProps<{
  meetDates: string[];
}>();

const rSince = computed(() => ratioSince(props.meetDates, "2025-10-11"));
const r365 = computed(() => ratioLast365(props.meetDates));
const r30 = computed(() => ratioLast30(props.meetDates));
const streakNow = computed(() => currentStreak(props.meetDates));
const streakBest = computed(() => longestStreak(props.meetDates));
const totalDuration = computed(() => totalMeetDurationDays(props.meetDates));

const years = computed(() => {
  const y = extractYears(props.meetDates);
  return y.length ? y : [new Date().getFullYear()];
});

const now = new Date();
const year = ref<number>(years.value[0] ?? now.getFullYear());
const monthYear = ref<number>(years.value[0] ?? now.getFullYear());
const month = ref(now.getMonth() + 1);

const rYear = computed(() => ratioYear(props.meetDates, year.value));
const rMonth = computed(() => ratioMonth(props.meetDates, monthYear.value, month.value));

function percent(v: number) {
  return (v * 100).toFixed(1) + "%";
}
</script>

<style scoped>
.wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.leftCol,
.rightCol {
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
}

.block {
  height: 95px;
  padding: 14px 14px 15px;
  border-radius: 14px;
  background: linear-gradient(145deg, #fff9f8 10%, #fff6f2 100%);
  border: 1px solid var(--line);
  position: relative;
  overflow: hidden;
}

.block::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 14px 0 0 14px;
  background: #f2c2ce;
  opacity: 0.75;
}

.hero .big {
  font-size: 34px;
  background: linear-gradient(120deg, #dd5676, #b44661);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.metricGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.mini {
  padding: 12px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: #91626c;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.big {
  font-size: 34px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
}

.value {
  font-size: 24px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

select {
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}

.monthControls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}

.durationBlock .big {
  color: var(--primary);
  margin-top: 0;
}

.durationBlock .label {
  font-size: 14px;
}

.durationRow {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric365::before {
  background: #c4acc8;
}

.metric30::before {
  background: #d8a5b4;
}

.streakNow::before {
  background: #e5b680;
}

.streakBest::before {
  background: #d7a57a;
}

.yearBlock::before {
  background: #bfa6cf;
}

.monthBlock::before {
  background: #d8a3ba;
}

.durationBlock::before {
  background: #de6c8e;
}

@media (max-width: 900px) {
  .wrap {
    grid-template-columns: 1fr;
  }
}
</style>
