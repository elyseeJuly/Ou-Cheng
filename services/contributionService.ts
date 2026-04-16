/**
 * 偶成 (Ou Cheng) — 贡献回馈服务
 * 用于将纠错后的典籍数据格式化为 chinese-poetry 项目所需的格式
 */

import { ClassicPoem } from '../types';

export interface CorrectionReport {
  original: ClassicPoem;
  corrected: ClassicPoem;
  notes: string;
  timestamp: number;
}

/**
 * 格式化为 GitHub Issue 模板内容
 */
export function formatCorrectionIssue(report: CorrectionReport): string {
  const { original, corrected, notes } = report;
  
  return `
### 诗词纠错建议 (由 偶成 Ou-Cheng AI 审计发现)

**元数据信息：**
- 标题：${original.title}
- 作者：${original.author}
- 朝代：${original.dynasty || '未知'}

**纠错详情：**
- **原文内容**：
  \`\`\`
  ${original.content}
  \`\`\`
- **建议修正内容**：
  \`\`\`
  ${corrected.content}
  \`\`\`

**修改理由/AI 审计报告：**
${notes}

---
*此纠错信息由「偶成」格律引擎自动检测并由用户确认生成。*
  `.trim();
}

/**
 * 格式化为 JSON 字符串以便在 Issue 中粘贴
 */
export function formatCorrectionJSON(report: CorrectionReport): string {
  return JSON.stringify({
    title: report.corrected.title,
    author: report.corrected.author,
    content: report.corrected.content,
    dynasty: report.corrected.dynasty,
    notes: report.notes,
    source: "Ou-Cheng AI Audit"
  }, null, 2);
}

/**
 * 获取 chinese-poetry 项目的 Issue 链接
 */
export function getUpstreamIssueUrl(title: string): string {
  const baseUrl = "https://github.com/chinese-poetry/chinese-poetry/issues/new";
  const params = new URLSearchParams({
    title: `[Data Correction] ${title}`,
    labels: "bug,data",
  });
  return `${baseUrl}?${params.toString()}`;
}
