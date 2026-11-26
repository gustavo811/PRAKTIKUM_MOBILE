// Layanan Storage KasirKu - Products & Transactions di Supabase (per user_id)

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_EMPLOYEES,
  INITIAL_PRODUCTS,
  INITIAL_STORE_INFO,
} from '../constants/initialData';
import { fetchFnBProducts } from './fnbApi';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  EMPLOYEES: '@kasirku_employees_v1',
  STORE_INFO: '@kasirku_store_info_v1',
};

const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
};

const mapProductFromDb = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: Number(row.price) || 0,
  cost: Number(row.cost) || 0,
  stock: Number(row.stock) || 0,
  isAvailable: row.is_available ?? (Number(row.stock) || 0) > 0,
  description: row.description || '',
  icon: row.icon || 'restaurant-outline',
});

const mapProductToDb = (product, userId) => ({
  id: product.id,
  user_id: userId,
  name: product.name,
  category: product.category || 'Makanan',
  price: Number(product.price) || 0,
  cost: Number(product.cost) || 0,
  stock: Number(product.stock) || 0,
  is_available: product.isAvailable ?? (Number(product.stock) || 0) > 0,
  description: product.description || '',
  icon: product.icon || 'restaurant-outline',
});

const mapTransactionFromDb = (row) => ({
  id: row.id,
  date: row.date,
  customerName: row.customer_name || 'Pelanggan Umum',
  paymentMethod: row.payment_method || 'TUNAI',
  items: Array.isArray(row.items) ? row.items : [],
  subtotal: Number(row.subtotal) || 0,
  discountPercent: Number(row.discount_percent) || 0,
  discountAmount: Number(row.discount_amount) || 0,
  grandTotal: Number(row.grand_total) || 0,
  cashGiven: Number(row.cash_given) || 0,
  changeAmount: Number(row.change_amount) || 0,
  cashierId: row.cashier_id || row.user_id,
  cashierName: row.cashier_name || 'Kasir',
});

const mapTransactionToDb = (tx, userId) => ({
  id: tx.id || 'TRX-' + Date.now().toString().slice(-8),
  user_id: userId,
  date: tx.date || new Date().toISOString(),
  customer_name: tx.customerName || 'Pelanggan Umum',
  payment_method: tx.paymentMethod || 'TUNAI',
  items: tx.items || [],
  subtotal: Number(tx.subtotal) || 0,
  discount_percent: Number(tx.discountPercent) || 0,
  discount_amount: Number(tx.discountAmount) || 0,
  grand_total: Number(tx.grandTotal) || 0,
  cash_given: Number(tx.cashGiven) || 0,
  change_amount: Number(tx.changeAmount) || 0,
  cashier_id: tx.cashierId || userId,
  cashier_name: tx.cashierName || 'Kasir',
});

export const storage = {
  // ==================== PRODUK & KATALOG (SUPABASE) ====================
  async getProducts() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getProducts:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map(mapProductFromDb);
      }

      // Jika katalog user masih kosong, isi awal dari External API FnB (atau fallback INITIAL_PRODUCTS)
      const apiProducts = await fetchFnBProducts();
      const seedProducts =
        apiProducts && apiProducts.length > 0 ? apiProducts : INITIAL_PRODUCTS;

      if (seedProducts.length > 0) {
        await this.saveProducts(seedProducts);
        const { data: seeded } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return seeded ? seeded.map(mapProductFromDb) : seedProducts;
      }

      return [];
    } catch (e) {
      console.error('Error getProducts:', e);
      return [];
    }
  },

  async syncProductsFromApi() {
    try {
      const apiProducts = await fetchFnBProducts();
      if (apiProducts && apiProducts.length > 0) {
        await this.saveProducts(apiProducts);
        return await this.getProducts();
      }
      return await this.getProducts();
    } catch (e) {
      console.error('Error syncProductsFromApi:', e);
      return await this.getProducts();
    }
  },

  async saveProducts(products) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return false;

      const rows = products.map((p) => mapProductToDb(p, userId));
      const { error } = await supabase
        .from('products')
        .upsert(rows, { onConflict: 'user_id,id' });

      if (error) {
        console.error('Error saveProducts:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error saveProducts:', e);
      return false;
    }
  },

  async updateProduct(updatedProduct) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const payload = mapProductToDb(updatedProduct, userId);
      const { error } = await supabase
        .from('products')
        .update({
          name: payload.name,
          category: payload.category,
          price: payload.price,
          cost: payload.cost,
          stock: payload.stock,
          is_available: payload.is_available,
          description: payload.description,
          icon: payload.icon,
        })
        .eq('id', updatedProduct.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updateProduct:', error.message);
        return null;
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error updateProduct:', e);
      return null;
    }
  },

  async addProduct(newProduct) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const productWithId = {
        ...newProduct,
        id: newProduct.id || 'prod-' + Date.now().toString().slice(-6),
        isAvailable: (newProduct.stock ?? 0) > 0,
      };

      const { error } = await supabase
        .from('products')
        .insert(mapProductToDb(productWithId, userId));

      if (error) {
        console.error('Error addProduct:', error.message);
        return null;
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error addProduct:', e);
      return null;
    }
  },

  async deleteProduct(productId) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleteProduct:', error.message);
        return null;
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error deleteProduct:', e);
      return null;
    }
  },

  async decreaseProductStock(itemsPurchased) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const list = await this.getProducts();
      for (const item of itemsPurchased) {
        const product = list.find((p) => p.id === item.id);
        if (!product) continue;

        const nextStock = Math.max(0, (product.stock || 0) - item.quantity);
        const { error } = await supabase
          .from('products')
          .update({
            stock: nextStock,
            is_available: nextStock > 0,
          })
          .eq('id', product.id)
          .eq('user_id', userId);

        if (error) {
          console.error('Error decreaseProductStock item:', error.message);
        }
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error decreaseProductStock:', e);
      return null;
    }
  },

  // ==================== TRANSAKSI (SUPABASE) ====================
  async getTransactions() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error getTransactions:', error.message);
        return [];
      }

      return data ? data.map(mapTransactionFromDb) : [];
    } catch (e) {
      console.error('Error getTransactions:', e);
      return [];
    }
  },

  async addTransaction(transaction) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { error } = await supabase
        .from('transactions')
        .insert(mapTransactionToDb(transaction, userId));

      if (error) {
        console.error('Error addTransaction:', error.message);
        return null;
      }

      return await this.getTransactions();
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
    } catch {
      return INITIAL_STORE_INFO;
    }
  },
};
