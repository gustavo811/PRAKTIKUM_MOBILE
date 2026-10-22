import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { THEME, formatRupiah } from '../src/constants/theme';
import { MENU_CATEGORIES } from '../src/constants/initialData';
import ProductCard from '../src/components/ProductCard';
import CartModal from '../src/components/CartModal';
import PaymentModal from '../src/components/PaymentModal';
import Header from '../src/components/Header';
import { storage } from '../src/services/storage';
import { secureStorage } from '../src/services/secureStorage';

export default function KasirScreen() {
  // 1. Penerapan useState untuk mengelola state lokal kasir POS
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modal Visibility State
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [activePaymentData, setActivePaymentData] = useState<any>(null);

  // 1. Penerapan useEffect untuk mengambil data awal saat komponen pertama kali dirender
  useEffect(() => {
    loadInitialKasirData();
  }, []);

  const loadInitialKasirData = async () => {
    try {
      setIsLoading(true);

      // A. Ambil data sesi user aktif dari Secure Storage
      const user = await secureStorage.getObject(secureStorage.KEYS.AUTH_USER);
      if (!user) {
        // Jika belum login, gunakan router.replace ke auth
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);

      // B. Fetch data awal katalog produk dari AsyncStorage
      const initialProducts = await storage.getProducts();
      setProducts(initialProducts);

      // C. Fetch data informasi toko dari AsyncStorage
      const initialStore = await storage.getStoreInfo();
      setStoreInfo(initialStore);
    } catch (error) {
      console.error('Error saat load data kasir:', error);
      Alert.alert('Gagal Memuat Data', 'Tidak dapat mengambil data kasir dari storage.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProductsList = async () => {
    const freshList = await storage.getProducts();
    setProducts(freshList);
  };

  // 2. Penerapan router.replace() saat Logout agar alur login/logout bersih
  const handleLogout = async () => {
    try {
      await secureStorage.removeItem(secureStorage.KEYS.AUTH_USER);
      setCurrentUser(null);
      // Ganti route dan hapus kasir dari stack navigasi
      router.replace('/auth');
    } catch (e) {
      console.error('Gagal logout:', e);
    }
  };

  // Navigasi ke Halaman Riwayat Transaksi via router.push()
  const navigateToRiwayat = () => {
    // 2. Penerapan router.push() untuk berpindah ke halaman riwayat transaksi
    router.push('/riwayat');
  };

  // Navigasi ke Halaman Kelola Menu via router.push()
  const navigateToMenu = () => {
    // 2. Penerapan router.push() untuk berpindah ke halaman kelola menu
    router.push('/menu');
  };

  // ================= Keranjang & Transaksi Logic =================
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'Semua' || prod.category === selectedCategory;
    const matchesSearch = prod.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: any) => {
    if (!product.isAvailable || product.stock <= 0) {
      Alert.alert('Stok Habis', `Maaf, stok produk "${product.name}" sudah habis.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Batas Stok', `Maksimal pembelian untuk ${product.name} adalah ${product.stock}.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost || 0,
          stock: product.stock,
          quantity: 1,
          note: '',
        },
      ];
    });
  };

  const handleDecreaseQuantity = (product: any) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (!existing) return prevCart;
      if (existing.quantity <= 1) {
        return prevCart.filter((item) => item.id !== product.id);
      }
      return prevCart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  const handleUpdateCartNote = (productId: string, newNote: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, note: newNote } : item
      )
    );
  };

  const handleProceedPayment = (paymentData: any) => {
    setActivePaymentData(paymentData);
    setPaymentModalVisible(true);
  };

  const handleCompleteTransaction = async (transaction: any) => {
    try {
      // 1. Kurangi stok di AsyncStorage
      await storage.decreaseProductStock(transaction.items);

      // 2. Simpan transaksi ke riwayat di AsyncStorage
      const fullTransaction = {
        ...transaction,
        cashierId: currentUser?.id,
        cashierName: currentUser?.name || 'Kasir',
      };
      await storage.addTransaction(fullTransaction);

      // 3. Refresh produk
      await refreshProductsList();

      // 4. Kosongkan keranjang
      setCart([]);
      setDiscountPercent(0);
      setPaymentModalVisible(false);

      // 5. Navigasi langsung ke Rincian Detail Nota menggunakan router.push()!
      // Memenuhi kriteria: router.push() untuk membuka detail nota
      Alert.alert(
        'Transaksi Berhasil!',
        `Pembayaran nota #${fullTransaction.id} sebesar ${formatRupiah(fullTransaction.grandTotal)} telah sukses disimpan.`,
        [
          {
            text: 'Lihat Detail Nota',
            onPress: () => {
              // 2. Penerapan router.push() untuk membuka rincian nota transaksi
              router.push({
                pathname: '/detail-nota',
                params: { id: fullTransaction.id },
              });
            },
          },
          {
            text: 'Kembali Kasir',
            style: 'cancel',
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Gagal memproses transaksi kasir.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan Sistem POS KasirKu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* HEADER ATAS DENGAN PROFIL & LOGOUT */}
      <Header
        currentUser={currentUser}
        storeInfo={storeInfo}
        onLogout={handleLogout}
      />

      {/* QUICK ACTION BAR: NAVIGASI KE RIWAYAT & KELOLA MENU */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={navigateToRiwayat}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={16} color={THEME.colors.primaryDark} />
          <Text style={styles.actionChipText}>Riwayat Transaksi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionChip}
          onPress={navigateToMenu}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant-outline" size={16} color={THEME.colors.primaryDark} />
          <Text style={styles.actionChipText}>Kelola Menu & Stok</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari makanan, kopi, minuman..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* HORIZONTAL CATEGORIES */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MENU_CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* GRID DAFTAR PRODUK */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cartItem = cart.find((c) => c.id === item.id);
          const quantity = cartItem ? cartItem.quantity : 0;
          return (
            <ProductCard
              product={item}
              cartQuantity={quantity}
              onAddToCart={() => handleAddToCart(item)}
              onDecreaseQuantity={() => handleDecreaseQuantity(item)}
              onAddNote={() => {}}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={THEME.colors.borderDark} />
            <Text style={styles.emptyTitle}>Menu tidak ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Coba gunakan kata kunci lain atau pilih kategori Semua.
            </Text>
          </View>
        }
      />

      {/* FLOATING BOTTOM CART BAR */}
      {cart.length > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartBadgeCount}>
              <Text style={styles.cartBadgeCountText}>{totalCartItems}</Text>
            </View>
            <View>
              <Text style={styles.cartBarLabel}>Total Belanja</Text>
              <Text style={styles.cartBarPrice}>{formatRupiah(totalCartAmount)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cartBarButtonText}>Lihat Keranjang</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* DRAWER MODAL KERANJANG */}
      <CartModal
        visible={cartModalVisible}
        cart={cart}
        discountPercent={discountPercent}
        onClose={() => setCartModalVisible(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={(id: string) => handleUpdateCartQuantity(id, 0)}
        onUpdateNote={handleUpdateCartNote}
        onClearCart={() => setCart([])}
        onSelectDiscount={setDiscountPercent}
        onProceedPayment={handleProceedPayment}
      />

      {/* MODAL PROSES PEMBAYARAN */}
      <PaymentModal
        visible={paymentModalVisible}
        paymentData={activePaymentData}
        onClose={() => setPaymentModalVisible(false)}
        onCompleteTransaction={handleCompleteTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.bg,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  quickActionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  productsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.lg,
  },
  cartBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadgeCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeCountText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cartBarLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  cartBarPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  cartBarButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cartBarButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
