// Layar Utama POS (Point of Sale) KasirKu

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../constants/theme';
import { MENU_CATEGORIES } from '../constants/initialData';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import { storage } from '../services/storage';

export default function KasirScreen({
  products,
  onRefreshProducts,
  currentUser,
  activeShift,
  storeInfo,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modals Visibility
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Data for active payment & completed receipt
  const [activePaymentData, setActivePaymentData] = useState(null);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  // Modal Custom Note untuk Item Produk
  const [noteModalItem, setNoteModalItem] = useState(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  // Hitung ringkasan keranjang
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filter produk berdasarkan kategori dan kata kunci
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'Semua' || prod.category === selectedCategory;
    const matchesSearch = prod.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Tambah item ke keranjang (+1)
  const handleAddToCart = (product) => {
    if (!product.isAvailable || product.stock <= 0) {
      Alert.alert('Stok Habis', `Maaf, produk "${product.name}" sedang habis.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Batas Stok', `Hanya tersedia ${product.stock} porsi untuk item ini.`);
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

  // Kurangi item dari keranjang (-1)
  const handleDecreaseQuantity = (product) => {
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

  // Update kuantitas langsung dari Drawer Keranjang
  const handleUpdateCartQuantity = (productId, newQty) => {
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

  const handleUpdateCartNote = (productId, newNote) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, note: newNote } : item
      )
    );
  };

  const handleOpenNoteModal = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    setNoteModalItem(product);
    setItemNoteInput(existing?.note || '');
  };

  const handleSaveModalNote = () => {
    if (noteModalItem) {
      handleUpdateCartNote(noteModalItem.id, itemNoteInput.trim());
      setNoteModalItem(null);
      setItemNoteInput('');
    }
  };

  // Proses Lanjut ke Pembayaran
  const handleProceedPayment = (paymentData) => {
    setActivePaymentData(paymentData);
    setPaymentModalVisible(true);
  };

  // Penyelesaian Transaksi Sukses
  const handleCompleteTransaction = async (transaction) => {
    try {
      // 1. Kurangi stok produk di database AsyncStorage
      await storage.decreaseProductStock(transaction.items);
      
      // 2. Simpan transaksi ke riwayat
      const fullTransaction = {
        ...transaction,
        cashierId: currentUser?.id,
        cashierName: currentUser?.name || 'Kasir',
        shiftId: activeShift?.id || 'shift-umum',
        shiftName: activeShift?.name || 'Shift Umum',
      };
      await storage.addTransaction(fullTransaction);

      // 3. Refresh produk di state parent
      await onRefreshProducts();

      // 4. Kosongkan keranjang & tutup modal bayar
      setCart([]);
      setDiscountPercent(0);
      setPaymentModalVisible(false);

      // 5. Buka Nota Digital
      setCompletedTransaction(fullTransaction);
      setReceiptModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Gagal memproses transaksi.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar & Reset Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari menu, kopi, camilan..."
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

      {/* Kategori Filter Bar */}
      <View style={styles.categoryBarContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MENU_CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid Katalog Produk POS */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.productListContent,
          totalCartItems > 0 && { paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cartItem = cart.find((c) => c.id === item.id);
          return (
            <ProductCard
              product={item}
              cartQuantity={cartItem ? cartItem.quantity : 0}
              onAddToCart={handleAddToCart}
              onDecreaseQuantity={handleDecreaseQuantity}
              onAddNote={handleOpenNoteModal}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>Menu Tidak Ditemukan</Text>
            <Text style={styles.emptyDesc}>
              Tidak ada produk yang cocok dengan pencarian "{searchQuery}".
            </Text>
          </View>
        }
      />

      {/* FLOATING CART BAR (Bar Keranjang Melayang) */}
      {totalCartItems > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBadge}>
                <Ionicons name="cart" size={20} color="#FFF" />
                <View style={styles.cartBadgeCount}>
                  <Text style={styles.cartBadgeCountText}>{totalCartItems}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.cartBarTotalTitle}>Total Tagihan</Text>
                <Text style={styles.cartBarTotalPrice}>
                  {formatRupiah(totalCartAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarBtnText}>Lihat Pesanan</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Drawer Keranjang */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        cart={cart}
        discountPercent={discountPercent}
        onSelectDiscount={setDiscountPercent}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={(id) => handleUpdateCartQuantity(id, 0)}
        onUpdateNote={handleUpdateCartNote}
        onClearCart={() => setCart([])}
        onProceedPayment={handleProceedPayment}
      />

      {/* Modal Pembayaran */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        paymentData={activePaymentData}
        onCompleteTransaction={handleCompleteTransaction}
      />

      {/* Modal Nota Digital */}
      <ReceiptModal
        visible={receiptModalVisible}
        transaction={completedTransaction}
        storeInfo={storeInfo}
        cashierName={currentUser?.name}
        shiftName={activeShift?.name}
        onClose={() => {
          setReceiptModalVisible(false);
          setCompletedTransaction(null);
        }}
      />

      {/* Modal Tambah Catatan Khusus Produk */}
      <Modal
        visible={!!noteModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalItem(null)}
      >
        <View style={styles.noteModalOverlay}>
          <View style={styles.noteModalBox}>
            <Text style={styles.noteModalTitle}>Catatan Pesanan</Text>
            <Text style={styles.noteModalSub}>{noteModalItem?.name}</Text>
            <TextInput
              style={styles.noteModalInput}
              placeholder="Contoh: Kurang manis, Es dipisah, dll"
              placeholderTextColor={THEME.colors.textMuted}
              value={itemNoteInput}
              onChangeText={setItemNoteInput}
              autoFocus
            />
            <View style={styles.noteModalBtns}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() => setNoteModalItem(null)}
              >
                <Text style={styles.noteCancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteSaveBtn}
                onPress={handleSaveModalNote}
              >
                <Text style={styles.noteSaveBtnText}>Simpan Catatan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  categoryBarContainer: {
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.colors.primaryDark,
    borderColor: THEME.colors.primaryDark,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  columnWrapper: {
    gap: 12,
  },
  productListContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...THEME.shadows.lg,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadge: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cartBadgeCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cartBarTotalTitle: {
    color: '#99F6E4',
    fontSize: 11,
    fontWeight: '600',
  },
  cartBarTotalPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  cartBarBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Note Modal
  noteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteModalBox: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    ...THEME.shadows.lg,
  },
  noteModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  noteModalSub: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteModalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    backgroundColor: THEME.colors.surfaceSubtle,
    marginBottom: 16,
  },
  noteModalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  noteCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  noteCancelBtnText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  noteSaveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  noteSaveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
