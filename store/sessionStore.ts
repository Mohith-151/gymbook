// store/sessionStore.ts
import { storage } from './mmkv';

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
  totalReps?: number; // Cached volume for instant heatmap loading
};

export type Sessions = Record<string, Session>;

const SESSIONS_KEY = 'gymbook:sessions';

export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getAllSessions(): Sessions {
  const val = storage.getString(SESSIONS_KEY);
  return val ? JSON.parse(val) : {};
}

export function getTodaySession(): Session | null {
  const sessions = getAllSessions();
  return sessions[todayKey()] ?? null;
}

export function saveSession(session: Session): void {
  const sessions = getAllSessions();
  
  // Pre-calculate & cache total completed reps when saving/locking
  const totalReps = session.exercises.reduce((total, ex) => {
    const doneSets = ex.setsData.filter((s) => s.done).length;
    return total + doneSets * ex.reps;
  }, 0);

  sessions[session.date] = { ...session, totalReps };
  storage.set(SESSIONS_KEY, JSON.stringify(sessions));
}

export function calcDensity(session: Session): number {
  if (!session.exercises.length) return 0;
  const total = session.exercises.reduce((s, e) => s + e.sets, 0);
  const done = session.exercises.reduce(
    (s, e) => s + e.setsData.filter((sd) => sd.done).length,
    0
  );
  return total === 0 ? 0 : done / total;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function sortExercises(list: SessionExercise[]): SessionExercise[] {
  return [...list].sort((a, b) => {
    const aR = a.setsData.filter((s) => s.done).length / a.sets;
    const bR = b.setsData.filter((s) => s.done).length / b.sets;
    if (aR >= 1 && bR < 1) return 1;
    if (bR >= 1 && aR < 1) return -1;
    return aR - bR;
  });
}