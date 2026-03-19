import type { Metrics } from "react-native-safe-area-context";

// Stub vazio - substitui a dependência do Manus Runtime
// O app funciona de forma standalone sem necessidade de comunicação com container externo

export function initManusRuntime(): void {
  // sem operação
}

export function subscribeSafeAreaInsets(
  _callback: (metrics: Metrics) => void
): () => void {
  return () => {};
}
