import { SummaryLength } from '../dto/summarize-article.dto';

export function buildSummarizePrompt(
  text: string,
  length: SummaryLength = SummaryLength.MEDIUM,
): string {
  const lengthMap = {
    short: 'in 1-2 sentences',
    medium: 'in 1 short paragraph',
    detailed: 'in a detailed structured summary',
  };

  return `
Summarize the following article ${lengthMap[length]}.

Return ONLY the summary text without additional explanations.

Article:
${text}
  `;
}
