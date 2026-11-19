/** 西文为主的文本（英文十四行诗等）：拉丁字母远多于汉字。 */
export function isLatinText(text: string): boolean {
  const latin = (text.match(/[A-Za-zÀ-ɏ]/g) || []).length;
  if (latin < 8) return false;
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  return cjk / latin < 0.2;
}
