<script setup>
import { ref } from "vue";

defineProps({
  currentPage: String
});

defineEmits(['navigate']);

const menuItems = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Configuration", icon: "⚙️" },
];

const userParams = {
  name: "Jane Doe",
  plan: "Pro Plan",
};
</script>

<template>
  <aside class="sidebar">
    <div class="logo-area">
      <div class="logo-text">
        <h1>Video Analyzer</h1>
      </div>
    </div>

    <nav class="nav-menu">
      <a
        v-for="item in menuItems"
        :key="item.name"
        href="#"
        class="nav-item"
        :class="{ active: currentPage === item.name }"
        @click.prevent="$emit('navigate', item.name)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.name }}</span>
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border-dark);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  height: 100vh;
  box-sizing: border-box;
  position: sticky;
  top: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
  padding-left: 0.5rem;
}

.logo-icon {
  color: var(--color-accent);
  font-size: 1.5rem;
}

.logo-text h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-light);
  font-family: var(--font-primary);
}

.logo-text span {
  display: block;
  font-size: 0.6rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-item:hover {
  color: var(--color-text-light);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  background: rgba(20, 184, 166, 0.1); /* Teal tint */
  color: var(--color-accent);
  border: 1px solid rgba(20, 184, 166, 0.2);
}

.icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-top: 1px solid var(--color-border-dark);
  margin-top: auto;
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-sm);
  background: var(--color-bg-darker);
}

.avatar {
  width: 36px;
  height: 36px;
  background: #14b8a6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-info .name {
  color: var(--color-text-light);
  font-size: 0.9rem;
  font-weight: 600;
}

.user-info .plan {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.logout-icon {
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
}
</style>
