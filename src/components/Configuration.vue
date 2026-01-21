<script setup>
import { useConfig } from '../composables/useConfig';
import { ref } from 'vue';

const { apiKey, modelName, framesPerSecond, saveSettings } = useConfig();
const saveStatus = ref('');

const handleSave = () => {
  saveSettings();
  saveStatus.value = 'Saved!';
  setTimeout(() => {
    saveStatus.value = '';
  }, 2000);
};
</script>

<template>
  <div class="config-container">
    <h2>Configuration</h2>
    
    <div class="controls">
      <!-- API Key Section -->
      <div class="input-group">
        <label>OpenRouter API Key</label>
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-or-..."
          class="api-input"
        />
        <p class="help-text">
          Your API key is stored locally in your browser and never sent to our servers.
        </p>
      </div>

      <!-- Model Section -->
      <div class="input-group">
        <label>Model Name</label>
        <input
          v-model="modelName"
          type="text"
          placeholder="google/gemini-2.0-flash-exp"
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

      <!-- Save Button -->
      <div class="action-row">
        <button 
          class="save-btn" 
          @click="handleSave" 
          :class="{ 'saved': saveStatus === 'Saved!' }"
        >
          {{ saveStatus || 'Save Settings' }}
        </button>
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
  appearance: auto;
}

.help-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}

.action-row {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.save-btn:active {
  transform: translateY(0);
}

.save-btn.saved {
  background: var(--color-success);
  pointer-events: none;
}
</style>
