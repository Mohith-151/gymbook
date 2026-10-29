// store/exerciseStore.ts
import { storage } from './mmkv';

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
};

const EXERCISES_KEY = 'gymbook:exercises';

export function getExercises(): Exercise[] {
  const val = storage.getString(EXERCISES_KEY);
  return val ? JSON.parse(val) : [];
}

export function saveExercise(exercise: Exercise): void {
  const list = getExercises();
  const idx = list.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) list[idx] = exercise;
  else list.push(exercise);
  storage.set(EXERCISES_KEY, JSON.stringify(list));
}

export function deleteExercise(id: string): void {
  const list = getExercises();
  storage.set(EXERCISES_KEY, JSON.stringify(list.filter((e) => e.id !== id)));
}