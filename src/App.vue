<script setup>
import { ref } from 'vue';
import { useConfig } from './composables/useConfig';
import VideoProcessor from "./components/VideoProcessor.vue";
import Sidebar from "./components/Sidebar.vue";
import Configuration from "./components/Configuration.vue";

const currentPage = ref('Dashboard');
const { totalSessionCost } = useConfig();

const navigateTo = (page) => {
  currentPage.value = page;
};
</script>

<template>
  <div class="app-container">
    <Sidebar :current-page="currentPage" @navigate="navigateTo" />
    <main class="main-content">
      <!-- Breadcrumbs / Top Bar could go here -->
      <header class="top-bar">
        <div class="breadcrumbs">
          <div v-if="totalSessionCost > 0" class="cost-display">
            <span class="label">Session Cost:</span>
            <span class="value">£{{ totalSessionCost.toFixed(5) }}</span>
          </div>
        </div>
      </header>

      <div class="content-scrollable">
        <VideoProcessor v-if="currentPage === 'Dashboard'" />
        <Configuration v-else-if="currentPage === 'Configuration'" />
      </div>
    </main>
  </div>
</template>

<style>
:root {
  /* Fonts */
  --font-primary: "Outfit", sans-serif;
  --font-secondary: "Inter", sans-serif;

  /* Dark Theme Colors (Slate + Teal) */
  --color-bg-main: #0f172a; /* Slate 900 */
  --color-bg-sidebar: #0f172a; /* Slate 900 */
  --color-bg-surface: #1e293b; /* Slate 800 */
  --color-bg-darker: #020617; /* Slate 950 */

  --color-primary: #14b8a6; /* Teal 500 */
  --color-primary-rgb: 20, 184, 166;
  --color-primary-hover: #0d9488; /* Teal 600 */
  --color-accent: #2dd4bf; /* Teal 400 */

  --color-text-main: #f1f5f9; /* Slate 100 */
  --color-text-light: #ffffff;
  --color-text-muted: #94a3b8; /* Slate 400 */

  --color-border: #334155; /* Slate 700 */
  --color-border-dark: #1e293b; /* Slate 800 */

  --color-success: #10b981;
  --color-error: #ef4444;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg:
    0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
  --shadow-xl:
    0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3);

  /* Radius */
  --radius-sm: 0.25rem;
}

body {
  margin: 0;
  padding: 0;
  background: var(--color-bg-main);
  color: var(--color-text-main);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
}

/* Global Layout */
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-main);
  position: relative;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.content-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* Let children handle padding if needed, or set global padding here */
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.crumb-active {
  color: var(--color-text-main);
  font-weight: 500;
}

.separator {
  opacity: 0.5;
}

/* Cost Display */
.cost-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 0.85rem;
}

.cost-display .label {
  color: var(--color-text-muted);
  font-weight: 500;
}

.cost-display .value {
  color: var(--color-success);
  font-weight: 600;
  font-family: monospace;
}

/* Global Buttons */
button {
  font-family: var(--font-primary);
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: var(--color-primary);
  color: #0f172a; /* Dark text on bright teal */
}

.btn-primary:hover {
  background: var(--color-accent);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.btn-secondary:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text-main);
}
</style>
