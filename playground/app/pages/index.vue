<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import { createPageProvider } from "../utils/mockData";
import ProductItem from "../components/ProductItem.vue";

const route = useRoute();
const router = useRouter();

const totalItems = ref(Number(route.query.total) || 2000);
const pageSize = ref(Number(route.query.size) || 20);
const scrollMode = ref((route.query.mode as string) || "vertical");
const scrollBehavior = ref<"smooth" | "auto">(
  (route.query.behavior as "smooth" | "auto") || "smooth",
);
const gap = ref(Number(route.query.gap) || 0);
const scrollToIndex = ref<number | null>(null);
const currentScrollTo = ref<number | undefined>(undefined);

watch(
  [totalItems, pageSize, scrollMode, scrollBehavior, gap],
  ([total, size, mode, behavior, g]) => {
    router.replace({
      query: {
        ...route.query,
        total: total.toString(),
        size: size.toString(),
        mode,
        behavior,
        gap: g.toString(),
      },
    });
  },
);

const modeOptions = [
  { label: "Vertical", value: "vertical" },
  { label: "Horizontal", value: "horizontal" },
];

const behaviorOptions = [
  { label: "Smooth", value: "smooth" },
  { label: "Auto", value: "auto" },
];

const pageProvider = computed(() => createPageProvider(totalItems.value));

const handleScrollTo = () => {
  if (scrollToIndex.value !== null) {
    currentScrollTo.value = scrollToIndex.value;
    setTimeout(() => {
      currentScrollTo.value = undefined;
    }, 0);
  }
};
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">VVirtualGrid</h1>
        <p class="subtitle">Nuxt · SSR Demo</p>
      </div>

      <div class="controls">
        <section class="control-group">
          <label class="control-label"
            >Total Items: <span class="mono">{{ totalItems }}</span></label
          >
          <Slider
            v-model="totalItems"
            :min="10"
            :max="10000"
            class="control-input"
          />
        </section>

        <section class="control-group">
          <label class="control-label">Scroll Mode</label>
          <SelectButton
            v-model="scrollMode"
            :options="modeOptions"
            optionLabel="label"
            optionValue="value"
            class="control-input grid-select"
          />
        </section>

        <section class="control-group">
          <label class="control-label">Scroll Behavior</label>
          <SelectButton
            v-model="scrollBehavior"
            :options="behaviorOptions"
            optionLabel="label"
            optionValue="value"
            class="control-input grid-select"
          />
        </section>

        <section class="control-group">
          <label class="control-label"
            >Gap: <span class="mono">{{ gap }}px</span></label
          >
          <Slider v-model="gap" :min="0" :max="32" class="control-input" />
        </section>

        <section class="control-group">
          <label class="control-label">Jump to Index</label>
          <div class="flex-row">
            <InputNumber
              v-model="scrollToIndex"
              :min="0"
              :max="totalItems - 1"
              placeholder="Index"
              class="index-input"
            />
            <Button label="Go" @click="handleScrollTo" severity="primary" />
          </div>
        </section>
      </div>

      <footer class="sidebar-footer">
        <p>Built with Nuxt &amp; RxJS</p>
      </footer>
    </aside>
    <main class="content-area" :class="scrollMode">
      <VirtualGrid
        :length="totalItems"
        :page-size="pageSize"
        :page-provider="pageProvider"
        :scroll-to="currentScrollTo"
        :scroll-behavior="scrollBehavior"
        class="grid-instance"
        :class="scrollMode"
        :style="{ gap: `${gap}px` }"
      >
        <template #probe>
          <ProductItem />
        </template>
        <template #default="{ item, style }">
          <ProductItem :item="item" :style="style" />
        </template>
        <template #placeholder="{ style }">
          <ProductItem :style="style" />
        </template>
      </VirtualGrid>
    </main>
  </div>
</template>

<style>
/* ── Layout ──────────────────────────────────────────── */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ── Sidebar ─────────────────────────────────────────── */
.sidebar {
  width: 300px;
  background: var(--app-bg);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  flex-shrink: 0;
}

.sidebar-header {
  margin-bottom: 2.5rem;
}

.logo {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--app-text);
}

.subtitle {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--app-text-muted);
  margin: 0.25rem 0 0 0;
  letter-spacing: 0.04em;
}

/* ── Controls ────────────────────────────────────────── */
.controls {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.control-label {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--app-text-muted);
}

.control-input {
  width: 100%;
}

.grid-select :deep(.p-button) {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.flex-row {
  display: flex;
  gap: 0.5rem;
}

.index-input {
  flex-grow: 1;
}

/* ── Footer ──────────────────────────────────────────── */
.sidebar-footer {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--app-text-muted);
}

/* ── Content area ────────────────────────────────────── */
.content-area {
  flex-grow: 1;
  background: var(--app-hover);
  position: relative;
}

.content-area.vertical {
  overflow-y: auto;
  overflow-x: hidden;
}

.content-area.horizontal {
  overflow-x: auto;
  overflow-y: hidden;
}

/* ── Grid instance ───────────────────────────────────── */
.grid-instance {
  width: 100%;
}

.grid-instance.vertical {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  padding: 16px;
}

@media (min-width: 800px) {
  .grid-instance.vertical {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .grid-instance.vertical {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1600px) {
  .grid-instance.vertical {
    grid-template-columns: repeat(4, 1fr);
  }
}

.grid-instance.horizontal {
  display: grid;
  grid-template-rows: repeat(1, 1fr);
  grid-auto-flow: column;
  height: 100%;
  padding: 16px;
}

@media (min-height: 600px) {
  .grid-instance.horizontal {
    grid-template-rows: repeat(2, 1fr);
  }
}

/* ── Scrollbar ───────────────────────────────────────── */
.content-area::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: var(--app-border);
}
</style>
