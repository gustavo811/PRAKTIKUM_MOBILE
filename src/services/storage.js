// Layanan Local Storage (AsyncStorage) untuk Data Operasional KasirKu

import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_STORE_INFO } from '../constants/initialData';

const STORAGE_KEYS = {
  PRODUCTS: '@kasirku_products_v1',
  TRANSACTIONS: '@kasirku_transactions_v1',
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


  // ==================== PEKERJA / USERS ====================
  async getEmployees() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) {
        let employees = JSON.parse(data);
        // Hapus akun demo lama dan pastikan Sarah role Kasir
        employees = employees
          .filter((emp) => !['budi', 'dina', 'admin'].includes(emp.username))
          .map((emp) => (emp.username === 'sarah' ? { ...emp, role: 'Kasir' } : emp));
        if (employees.length === 0) {
          employees = INITIAL_EMPLOYEES;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        return employees;
      }
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
