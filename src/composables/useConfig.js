import { ref } from "vue";

const apiKey = ref("");
const modelName = ref("google/gemini-2.0-flash-exp:free");
const useEnvKey = ref(false);
const framesPerSecond = ref(1);
const totalSessionCost = ref(0.00045);
const lastAnalysisCost = ref(0);

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
