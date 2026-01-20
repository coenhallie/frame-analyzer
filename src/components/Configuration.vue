<script setup>
import { useConfig } from '../composables/useConfig';
import { onMounted } from 'vue';

const { apiKey, modelName, useEnvKey, framesPerSecond } = useConfig();

onMounted(() => {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (envKey && !apiKey.value) {
    useEnvKey.value = true;
    apiKey.value = envKey;
  }

  const envModel = import.meta.env.VITE_OPENROUTER_MODEL;
  if (envModel && modelName.value === 'google/gemini-3-flash-preview') {
    modelName.value = envModel;
  }
});
</script>

<template>
  <div class="config-container">
    <h2>Configuration</h2>
    
    <div class="controls">
      <!-- API Key Section -->
      <div class="input-group">
        <label>OpenRouter API Key</label>
        <div class="key-input-wrapper">
          <input
            v-if="!useEnvKey"
            v-model="apiKey"
            type="password"
            placeholder="sk-or-..."
            class="api-input"
          />
          <div v-else class="env-badge">Using .env API Key</div>
        </div>
        <label class="checkbox-label">
          <input type="checkbox" v-model="useEnvKey" />
          Use .env API Key
        </label>
      </div>

      <!-- Model Section -->
      <div class="input-group">
        <label>Model Name</label>
        <input
          v-model="modelName"
          type="text"
          placeholder="google/gemini-3-flash-preview"
        />
      </div>

      <!-- Frame Rate Section -->
      <div class="input-group">
        <div class="label-row">
          <label>Frame Extraction Rate</label>
          <span class="value-badge">{{ framesPerSecond }} FPS</span>
        </div>
        <input
          v-model.number="framesPerSecond"
          type="range"
          min="1"
          max="10"
          step="1"
          class="slider"
        />
        <p class="help-text">
          Higher FPS = more detailed analysis but higher cost/processing time.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

h2 {
  font-family: var(--font-primary);
  color: var(--color-text-main);
  font-size: 2rem;
  margin-bottom: 2rem;
  font-weight: 600;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: var(--color-bg-surface);
  padding: 2.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-group label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.input-group input[type="text"],
.input-group input[type="password"] {
  padding: 1rem;
  background: var(--color-bg-darker);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.key-input-wrapper {
  display: flex;
  gap: 1rem;
}

.env-badge {
  flex: 1;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

input[type="checkbox"] {
  accent-color: var(--color-primary);
  width: 1rem;
  height: 1rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-badge {
  background: var(--color-bg-darker);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.slider {
  width: 100%;
  accent-color: var(--color-primary);
  cursor: pointer;
  height: 6px;
  background: var(--color-bg-darker);
  border-radius: 999px;
  appearance: auto; /* Let browser handle basic slider style for now, acccent-color does heavy lifting */
}

.help-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
