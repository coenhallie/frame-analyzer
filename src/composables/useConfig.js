import { ref, watch } from "vue";

const apiKey = ref("");
const modelName = ref("google/gemini-3-flash-preview");
const useEnvKey = ref(false);
const framesPerSecond = ref(1);

// Initialize from session storage or default to 0
const storedCost = sessionStorage.getItem("frame-analyzer-session-cost");
const totalSessionCost = ref(storedCost ? parseFloat(storedCost) : 0);
const lastAnalysisCost = ref(0);

// Watch for changes and update session storage
watch(totalSessionCost, (newCost) => {
  sessionStorage.setItem("frame-analyzer-session-cost", newCost.toString());
});

export function useConfig() {
  return {
    apiKey,
    modelName,
    useEnvKey,
    framesPerSecond,
    totalSessionCost,
    lastAnalysisCost,
  };
}
