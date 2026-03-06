import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────

export type SetData = { done: boolean };

export type SessionExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  setsData: SetData[];
};

export type Session = {
  date: string; // 'YYYY-MM-DD'
  locked: boolean;
  exercises: SessionExercise[];
};

export type Sessions = Record<string, Session>;

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  notes: string;
};

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

// ── Keys ──────────────────────────────────────────────────

const KEYS = {
  EXERCISES: 'gymbook:exercises',
  TEMPLATES: 'gymbook:templates',
  SESSIONS: 'gymbook:sessions',
};

// ── Helpers ───────────────────────────────────────────────

async function get<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Exercise Library ──────────────────────────────────────

export async function getExercises(): Promise<Exercise[]> {
  return (await get<Exercise[]>(KEYS.EXERCISES)) ?? [];
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const list = await getExercises();
  const idx = list.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) list[idx] = exercise;
  else list.push(exercise);
  await set(KEYS.EXERCISES, list);
}

export async function deleteExercise(id: string): Promise<void> {
  const list = await getExercises();
  await set(KEYS.EXERCISES, list.filter((e) => e.id !== id));
}

// ── Templates ─────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  return (await get<Template[]>(KEYS.TEMPLATES)) ?? [];
}

export async function saveTemplate(template: Template): Promise<void> {
  const list = await getTemplates();
  const idx = list.findIndex((t) => t.id === template.id);
  if (idx >= 0) list[idx] = template;
  else list.push(template);
  await set(KEYS.TEMPLATES, list);
}

export async function deleteTemplate(id: string): Promise<void> {
  const list = await getTemplates();
  await set(KEYS.TEMPLATES, list.filter((t) => t.id !== id));
}

// ── Sessions ──────────────────────────────────────────────

export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getAllSessions(): Promise<Sessions> {
  return (await get<Sessions>(KEYS.SESSIONS)) ?? {};
}

export async function getTodaySession(): Promise<Session | null> {
  const sessions = await getAllSessions();
  return sessions[todayKey()] ?? null;
}

export async function saveSession(session: Session): Promise<void> {
  const sessions = await getAllSessions();
  sessions[session.date] = session;
  await set(KEYS.SESSIONS, sessions);
}

// ── Density ───────────────────────────────────────────────

export function calcDensity(session: Session): number {
  if (!session.exercises.length) return 0;
  const total = session.exercises.reduce((s, e) => s + e.sets, 0);
  const done = session.exercises.reduce(
    (s, e) => s + e.setsData.filter((sd) => sd.done).length,
    0
  );
  return total === 0 ? 0 : done / total;
}

// ── ID ────────────────────────────────────────────────────

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Sort exercises (least done first, complete last) ──────

export function sortExercises(list: SessionExercise[]): SessionExercise[] {
  return [...list].sort((a, b) => {
    const aR = a.setsData.filter((s) => s.done).length / a.sets;
    const bR = b.setsData.filter((s) => s.done).length / b.sets;
    if (aR >= 1 && bR < 1) return 1;
    if (bR >= 1 && aR < 1) return -1;
    return aR - bR;
  });
}
