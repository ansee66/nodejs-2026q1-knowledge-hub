export function buildTranslatePrompt(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  return `
Translate the following text into ${targetLanguage}.
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

Return ONLY translated text.

Text:
${text}
`;
}
