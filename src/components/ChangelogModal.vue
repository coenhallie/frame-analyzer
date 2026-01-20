<script setup>
defineProps({
  isOpen: Boolean
});

defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2>Changelog</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </header>

        <div class="modal-body">
          <div class="version-entry">
            <div class="version-header">
              <h3>Version 0.1 (Alpha)</h3>
              <span class="date">Jan 20, 2026</span>
            </div>
            <ul>
              <li>Initial alpha release.</li>
              <li>Added video upload and analysis pipeline.</li>
              <li>Implemented real-time cost tracking.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-light);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--color-text-light);
}

.modal-body {
  padding: 1.5rem; /* Increased padding */
  overflow-y: auto;
}

.version-entry {
  margin-bottom: 2rem;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
}

.version-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.version-header .date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--color-text-main); /* Ensure list text is visible */
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}
</style>
