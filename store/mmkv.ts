// store/mmkv.ts
import { createMMKV, type MMKV } from 'react-native-mmkv';

let _storage: MMKV | null = null;

function getStorage(): MMKV {
  if (!_storage) _storage = createMMKV();
  return _storage;
}

export const storage = {
  set(key: string, value: string | number | boolean) {
    getStorage().set(key, value);
  },
  getString(key: string): string | undefined {
    return getStorage().getString(key);
  },
  getNumber(key: string): number | undefined {
    return getStorage().getNumber(key);
  },
  getBoolean(key: string): boolean | undefined {
    return getStorage().getBoolean(key);
  },
  delete(key: string) {
    getStorage().remove(key);
  },
  clearAll() {
    getStorage().clearAll();
  },
  getAllKeys(): string[] {
    return getStorage().getAllKeys();
  },
};