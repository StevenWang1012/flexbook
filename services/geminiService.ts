// 已移除 Google GenAI 依賴與 API Key
// 此服務目前僅保留空殼，以防未來有組件呼叫時報錯

export const getYogaSequenceSuggestion = async (theme: string, level: string) => {
  console.warn("AI 功能已停用");
  return "AI 功能已從系統中移除。";
};

export const analyzeAttendance = async (records: any[]) => {
  console.warn("AI 功能已停用");
  return "AI 功能已從系統中移除。";
};