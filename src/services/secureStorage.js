// Layanan Secure Storage (Hardware Keystore / Keychain)
// Menyimpan data kredensial rahasia (password, auth token, sesi login)

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

// Fallback memory cache jika SecureStore tidak didukung di environment tertentu
const memoryFallback = {};

export const secureStorage = {
  /**
   * Simpan data terenkripsi ke Keystore/Keychain (atau localStorage di Web)
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`kasirku_sec_${key}`, stringValue);
        }
        memoryFallback[key] = stringValue;
        return true;
      }
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
   * Ambil data terenkripsi (atau localStorage di Web)
   */
  async getItem(key) {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          const webVal = window.localStorage.getItem(`kasirku_sec_${key}`);
          if (webVal !== null && webVal !== undefined) {
            return webVal;
          }
        }
        return memoryFallback[key] || null;
      }
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
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(`kasirku_sec_${key}`);
        }
        delete memoryFallback[key];
        return true;
      }
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
