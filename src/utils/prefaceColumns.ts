/** 标点与后引号不落行（栏）首，挂到上一行（栏）末尾——古籍「行末挂点」。 */
const NO_HEAD = /[，。、；：？！）》」』”’,.;:?!)]/;

/** 把导语按每行（栏）字数折开；空白先去掉，避免竖排时出现空格。 */
export function chunkPreface(text: string, perLine: number): string[] {
  const chars = Array.from((text || '').replace(/\s+/g, ''));
  const out: string[] = [];
  let line: string[] = [];
  const n = Math.max(1, Math.floor(perLine));
  chars.forEach(ch => {
    if (line.length >= n && !NO_HEAD.test(ch)) { out.push(line.join('')); line = []; }
    line.push(ch);
  });
  if (line.length) out.push(line.join(''));
  return out;
}
