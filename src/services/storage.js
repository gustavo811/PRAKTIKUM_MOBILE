// Layanan Local Storage (AsyncStorage) untuk Data Operasional KasirKu

import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_STORE_INFO } from '../constants/initialData';

const STORAGE_KEYS = {
  PRODUCTS: '@kasirku_products_v1',
  TRANSACTIONS: '@kasirku_transactions_v1',
  ACTIVE_SHIFT: '@kasirku_active_shift_v1',
  SHIFT_HISTORY: '@kasirku_shift_history_v1',
  ATTENDANCE_LOGS: '@kasirku_attendance_logs_v1',
  EMPLOYEES: '@kasirku_employees_v1',
  STORE_INFO: '@kasirku_store_info_v1',
};

export const storage = {
  // ==================== PRODUK & KATALOG ====================
  async getProducts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
      // Simpan data default pertama kali
      await this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    } catch (e) {
      console.error('Error getProducts:', e);
      return INITIAL_PRODUCTS;
    }
  },

  async saveProducts(products) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return true;
    } catch (e) {
      console.error('Error saveProducts:', e);
      return false;
    }
  },

  async updateProduct(updatedProduct) {
    try {
      const list = await this.getProducts();
      const idx = list.findIndex(p => p.id === updatedProduct.id);
      if (idx !== -1) {
        list[idx] = updatedProduct;
        await this.saveProducts(list);
      }
      return list;
    } catch (e) {
      console.error('Error updateProduct:', e);
      return null;
    }
  },

  async addProduct(newProduct) {
    try {
      const list = await this.getProducts();
      const productWithId = {
        ...newProduct,
        id: 'prod-' + Date.now().toString().slice(-6),
        isAvailable: true,
      };
      list.unshift(productWithId);
      await this.saveProducts(list);
      return list;
    } catch (e) {
      console.error('Error addProduct:', e);
      return null;
    }
  },

  async deleteProduct(productId) {
    try {
      const list = await this.getProducts();
      const filtered = list.filter(p => p.id !== productId);
      await this.saveProducts(filtered);
      return filtered;
    } catch (e) {
      console.error('Error deleteProduct:', e);
      return null;
    }
  },

  async decreaseProductStock(itemsPurchased) {
    try {
      const list = await this.getProducts();
      itemsPurchased.forEach(item => {
        const product = list.find(p => p.id === item.id);
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);
          if (product.stock === 0) {
            product.isAvailable = false;
          }
        }
      });
      await this.saveProducts(list);
      return list;
    } catch (e) {
      console.error('Error decreaseProductStock:', e);
      return null;
    }
  },

  // ==================== TRANSAKSI ====================
  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error getTransactions:', e);
      return [];
    }
  },

  async addTransaction(transaction) {
    try {
      const list = await this.getTransactions();
      const updatedList = [transaction, ...list];
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error('Error addTransaction:', e);
      return null;
    }
  },

  // ==================== MANAJEMEN SHIFT ====================
  async getActiveShift() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
      if (data) return JSON.parse(data);
      // Buat default active shift jika belum ada
      const defaultShift = {
        id: 'shift-' + Date.now().toString().slice(-6),
        name: 'Shift Pagi',
        cashierName: 'Sarah Amelia',
        cashierId: 'emp-001',
        startTime: new Date().toISOString(),
        openingCash: 200000, // Rp 200.000 modal awal default
        status: 'OPEN',
      };
      await this.setActiveShift(defaultShift);
      return defaultShift;
    } catch (e) {
      console.error('Error getActiveShift:', e);
      return null;
    }
  },

  async setActiveShift(shift) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
      return true;
    } catch (e) {
      console.error('Error setActiveShift:', e);
      return false;
    }
  },

  async getShiftHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error getShiftHistory:', e);
      return [];
    }
  },

  async closeActiveShift(closingData) {
    try {
      const activeShift = await this.getActiveShift();
      const history = await this.getShiftHistory();
      
      const closedShiftRecord = {
        ...activeShift,
        ...closingData,
        endTime: new Date().toISOString(),
        status: 'CLOSED',
      };

      const updatedHistory = [closedShiftRecord, ...history];
      await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_HISTORY, JSON.stringify(updatedHistory));
      
      // Hapus / null-kan active shift
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SHIFT);
      return closedShiftRecord;
    } catch (e) {
      console.error('Error closeActiveShift:', e);
      return null;
    }
  },

  // ==================== PRESENSI PEKERJA ====================
  async getAttendanceLogs() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error getAttendanceLogs:', e);
      return [];
    }
  },

  async saveAttendanceLogs(logs) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(logs));
      return true;
    } catch (e) {
      console.error('Error saveAttendanceLogs:', e);
      return false;
    }
  },

  // ==================== PEKERJA / USERS ====================
  async getEmployees() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    } catch (e) {
      console.error('Error getEmployees:', e);
      return INITIAL_EMPLOYEES;
    }
  },

  async addEmployee(newEmp) {
    try {
      const list = await this.getEmployees();
      const empWithId = {
        ...newEmp,
        id: 'emp-' + Date.now().toString().slice(-6),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
      const updated = [empWithId, ...list];
      await AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error addEmployee:', e);
      return null;
    }
  },

  // ==================== INFO TOKO ====================
  async getStoreInfo() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STORE_INFO);
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem(STORAGE_KEYS.STORE_INFO, JSON.stringify(INITIAL_STORE_INFO));
      return INITIAL_STORE_INFO;
    } catch (e) {
      return INITIAL_STORE_INFO;
    }
  },
};
