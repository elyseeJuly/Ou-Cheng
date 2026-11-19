import { CipaiData } from '../types';

export function getCipaiStanzas(cipai: CipaiData): string[][] {
  if (cipai.stanzas?.length) return cipai.stanzas;
  return [cipai.upperPattern || [], ...(cipai.lowerPattern?.length ? [cipai.lowerPattern] : [])];
}

export function getCipaiPatterns(cipai: CipaiData): string[] {
  return getCipaiStanzas(cipai).flat();
}
