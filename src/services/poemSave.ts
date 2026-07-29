import { Poem } from '../types';

export function mergePoemForSave(existing: Poem | undefined, next: Poem, timestamp: number): Poem {
  if (!existing) return { ...next, createdAt: next.createdAt || timestamp };
  return {
    ...existing,
    ...next,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: timestamp,
  };
}
