import { ref, watch } from "vue";

// Default values
const DEFAULT_MODEL = "anthropic/claude-opus-4.5";
const DEFAULT_FPS = 1;

// Initialize from localStorage or defaults
const storedApiKey = localStorage.getItem("frame-analyzer-api-key");
const storedModel = localStorage.getItem("frame-analyzer-model");
const storedFps = localStorage.getItem("frame-analyzer-fps");

const apiKey = ref(storedApiKey || "");
const modelName = ref(storedModel || DEFAULT_MODEL);
const framesPerSecond = ref(storedFps ? parseInt(storedFps) : DEFAULT_FPS);

// Initialize session cost from session storage or default to 0
const storedCost = sessionStorage.getItem("frame-analyzer-session-cost");
const totalSessionCost = ref(storedCost ? parseFloat(storedCost) : 0);
const lastAnalysisCost = ref(0);

// Watch for changes and update session storage for cost
watch(totalSessionCost, (newCost) => {
  sessionStorage.setItem("frame-analyzer-session-cost", newCost.toString());
});

// Function to save configurations to localStorage
function saveSettings() {
  localStorage.setItem("frame-analyzer-api-key", apiKey.value);
  localStorage.setItem("frame-analyzer-model", modelName.value);
  localStorage.setItem("frame-analyzer-fps", framesPerSecond.value.toString());
}

export function useConfig() {
  return {
    apiKey,
    modelName,
    framesPerSecond,
    totalSessionCost,
    lastAnalysisCost,
    saveSettings
  };
}
