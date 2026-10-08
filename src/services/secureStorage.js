// Layanan Secure Storage (Hardware Keystore / Keychain)
// Menyimpan data kredensial rahasia (password, auth token, sesi login)

import * as SecureStore from 'expo-secure-store';

// Fallback memory cache jika SecureStore tidak didukung di environment tertentu
const memoryFallback = {};

export const secureStorage = {
  /**
   * Simpan data terenkripsi ke Keystore/Keychain
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await SecureStore.setItemAsync(key, stringValue);
      memoryFallback[key] = stringValue;
      return true;
    } catch (error) {
      console.warn(`[SecureStore] Fallback to memory for ${key}:`, error?.message);
      memoryFallback[key] = typeof value === 'string' ? value : JSON.stringify(value);
      return false;
    }
  },

  /**
   * Ambil data terenkripsi
   */
  async getItem(key) {
    try {
      const result = await SecureStore.getItemAsync(key);
      if (result !== null && result !== undefined) {
        return result;
      }
      return memoryFallback[key] || null;
    } catch (error) {
      console.warn(`[SecureStore] Fallback to memory read for ${key}:`, error?.message);
      return memoryFallback[key] || null;
    }
  },

  /**
   * Ambil data JSON terenkripsi
   */
  async getObject(key) {
    try {
      const val = await this.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Hapus item terenkripsi
   */
  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
      delete memoryFallback[key];
      return true;
    } catch (error) {
      delete memoryFallback[key];
      return false;
    }
  },

  // Kunci-kunci penyimpanan standar
  KEYS: {
    AUTH_USER: 'kasirku_auth_user',
    REMEMBERED_CREDS: 'kasirku_remembered_credentials',
    ACTIVE_SESSION_TOKEN: 'kasirku_session_token',
  },
};
