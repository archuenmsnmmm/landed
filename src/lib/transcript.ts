export function normalizeTranscriptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function speechLangFromSetting(meetingLanguage = "English"): string {
  const map: Record<string, string> = {
    English: "en-US",
    Spanish: "es-ES",
    French: "fr-FR",
    German: "de-DE",
    Portuguese: "pt-BR",
    Chinese: "zh-CN",
    Japanese: "ja-JP",
  };
  return map[meetingLanguage] ?? "en-US";
}
