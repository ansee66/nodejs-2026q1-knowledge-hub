import { AnalysisTask } from '../dto/analyze-article.dto';

export function buildAnalyzePrompt(
  text: string,
  task: AnalysisTask = AnalysisTask.REVIEW,
): string {
  return `
Analyze the following text.

Task: ${task}

Return JSON with fields:
- analysis: string
- suggestions: string[]
- severity: "info" | "warning" | "error".
Return ONLY valid JSON. Do not include any text before or after JSON.

Text:
${text}
`;
}
