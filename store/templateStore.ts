// store/templateStore.ts
import { storage } from './mmkv';

export type TemplateExercise = {
  name: string;
  sets: number;
  reps: number;
};

export type Template = {
  id: string;
  name: string;
  exercises: TemplateExercise[];
};

const TEMPLATES_KEY = 'gymbook:templates';

export function getTemplates(): Template[] {
  const val = storage.getString(TEMPLATES_KEY);
  return val ? JSON.parse(val) : [];
}

export function saveTemplate(template: Template): void {
  const list = getTemplates();
  const idx = list.findIndex((t) => t.id === template.id);
  if (idx >= 0) list[idx] = template;
  else list.push(template);
  storage.set(TEMPLATES_KEY, JSON.stringify(list));
}

export function deleteTemplate(id: string): void {
  const list = getTemplates();
  storage.set(TEMPLATES_KEY, JSON.stringify(list.filter((t) => t.id !== id)));
}