// store/mmkv.ts
import { MMKV } from 'react-native-mmkv';

let _storage: MMKV | null = null;

export const storage = {
  set(key: string, value: string | number | boolean) {
    if (!_storage) _storage = new MMKV();
    _storage.set(key, value);
  },
  getString(key: string): string | undefined {
    if (!_storage) _storage = new MMKV();
    return _storage.getString(key);
  },
  getNumber(key: string): number | undefined {
    if (!_storage) _storage = new MMKV();
    return _storage.getNumber(key);
  },
  getBoolean(key: string): boolean | undefined {
    if (!_storage) _storage = new MMKV();
    return _storage.getBoolean(key);
  },
  delete(key: string) {
    if (!_storage) _storage = new MMKV();
    _storage.delete(key);
  },
  clearAll() {
    if (!_storage) _storage = new MMKV();
    _storage.clearAll();
  },
  getAllKeys(): string[] {
    if (!_storage) _storage = new MMKV();
    return _storage.getAllKeys();
  }
};