import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../src/constants/theme';
import { MENU_CATEGORIES } from '../src/constants/initialData';
import { storage } from '../src/services/storage';

export default function MenuScreen() {
  // 1. Penerapan useState untuk mengelola katalog menu produk
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'AVAILABLE' | 'LOW' | 'EMPTY'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('20');
  const [description, setDescription] = useState('');

  // 1. Penerapan useEffect untuk mengambil data awal produk dari AsyncStorage
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await storage.getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Error saat load data produk:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Penerapan router.back() untuk kembali ke kasir
  const handleGoBack = () => {
    router.back();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Makanan');
    setPrice('');
    setCost('');
    setStock('20');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingProduct(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setCost(item.cost ? item.cost.toString() : '');
    setStock(item.stock ? item.stock.toString() : '0');
    setDescription(item.description || '');
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Perhatian', 'Nama produk dan harga jual wajib diisi.');
      return;
    }

    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
    const costNum = parseInt(cost.replace(/[^0-9]/g, ''), 10) || 0;
    const stockNum = parseInt(stock.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingProduct) {
      const updated = {
        ...editingProduct,
        name: name.trim(),
        category,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        description: description.trim(),
        isAvailable: stockNum > 0,
      };
      await storage.updateProduct(updated);
    } else {
      const newProduct = {
        name: name.trim(),
        category,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        description: description.trim(),
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      };
      await storage.addProduct(newProduct);
    }

    await fetchProducts();
    setModalVisible(false);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Hapus Produk',
      `Yakin ingin menghapus "${productName}" dari katalog?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await storage.deleteProduct(productId);
            await fetchProducts();
          },
        },
      ]
    );
  };

  // Perhitungan statistik stok produk
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const emptyStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
  const availableCount = products.filter((p) => (p.stock || 0) > 5).length;

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());

    let matchStock = true;
    const currentStock = p.stock || 0;
    if (stockFilter === 'AVAILABLE') {
      matchStock = currentStock > 5;
    } else if (stockFilter === 'LOW') {
      matchStock = currentStock > 0 && currentStock <= 5;
    } else if (stockFilter === 'EMPTY') {
      matchStock = currentStock <= 0;
    }

    return matchCat && matchName && matchStock;
  });

  const renderStockBadge = (stockNum: number) => {
    if (stockNum <= 0) {
      return (
        <View style={[styles.stockBadge, styles.stockEmpty]}>
          <Text style={[styles.stockText, styles.stockTextEmpty]}>❌ Habis</Text>
        </View>
      );
    }
    if (stockNum <= 5) {
      return (
        <View style={[styles.stockBadge, styles.stockWarning]}>
          <Text style={[styles.stockText, styles.stockTextWarning]}>⚠️ Sisa {stockNum}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.stockBadge, styles.stockSafe]}>
        <Text style={[styles.stockText, styles.stockTextSafe]}>Stok: {stockNum}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* HEADER DENGAN TOMBOL KEMBALI ROUTER.BACK() */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Katalog Menu & Stok</Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>{products.length} Menu</Text>
            {lowStockCount > 0 && (
              <View style={styles.miniAlertBadge}>
                <Text style={styles.miniAlertBadgeText}>⚠️ {lowStockCount} Menipis</Text>
              </View>
            )}
            {emptyStockCount > 0 && (
              <View style={styles.miniDangerBadge}>
                <Text style={styles.miniDangerBadgeText}>❌ {emptyStockCount} Habis</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama menu..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* FILTER KATEGORI */}
      <View style={styles.categoryWrap}>
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
                style={[styles.catPill, isSelected && styles.catPillActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[styles.catPillText, isSelected && styles.catPillTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* FILTER STATUS STOK (KOMPONEN MODIFIKASI MODUL 2) */}
      <View style={styles.stockFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stockFilterList}>
          <TouchableOpacity
            style={[styles.stockFilterBtn, stockFilter === 'ALL' && styles.stockFilterBtnActive]}
            onPress={() => setStockFilter('ALL')}
          >
            <Text style={[styles.stockFilterText, stockFilter === 'ALL' && styles.stockFilterTextActive]}>
              Semua ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stockFilterBtn, stockFilter === 'AVAILABLE' && styles.stockFilterBtnActive]}
            onPress={() => setStockFilter('AVAILABLE')}
          >
            <Ionicons name="checkmark-circle-outline" size={13} color={stockFilter === 'AVAILABLE' ? '#FFF' : '#059669'} />
            <Text style={[styles.stockFilterText, stockFilter === 'AVAILABLE' ? styles.stockFilterTextActive : { color: '#059669' }]}>
              Tersedia ({availableCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stockFilterBtn, styles.stockFilterBtnLow, stockFilter === 'LOW' && styles.stockFilterBtnLowActive]}
            onPress={() => setStockFilter('LOW')}
          >
            <Ionicons name="warning-outline" size={13} color={stockFilter === 'LOW' ? '#FFF' : '#D97706'} />
            <Text style={[styles.stockFilterText, stockFilter === 'LOW' ? styles.stockFilterTextActive : { color: '#D97706' }]}>
              Menipis ({lowStockCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stockFilterBtn, styles.stockFilterBtnEmpty, stockFilter === 'EMPTY' && styles.stockFilterBtnEmptyActive]}
            onPress={() => setStockFilter('EMPTY')}
          >
            <Ionicons name="alert-circle-outline" size={13} color={stockFilter === 'EMPTY' ? '#FFF' : '#DC2626'} />
            <Text style={[styles.stockFilterText, stockFilter === 'EMPTY' ? styles.stockFilterTextActive : { color: '#DC2626' }]}>
              Habis ({emptyStockCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* DAFTAR MENU */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Memuat menu...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>Menu tidak ditemukan</Text>
              <Text style={styles.emptySub}>Coba sesuaikan filter kategori, pencarian, atau status stok.</Text>
              {(selectedCategory !== 'Semua' || search !== '' || stockFilter !== 'ALL') && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSelectedCategory('Semua');
                    setSearch('');
                    setStockFilter('ALL');
                  }}
                >
                  <Text style={styles.resetFilterText}>Reset Semua Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.menuCard}>
              <View style={styles.menuCardInfo}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  {renderStockBadge(item.stock || 0)}
                </View>
                <Text style={styles.menuCat}>{item.category}</Text>
                <Text style={styles.menuPrice}>{formatRupiah(item.price)}</Text>
              </View>

              <View style={styles.menuActions}>
                <TouchableOpacity
                  style={styles.actionBtnEdit}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil" size={16} color={THEME.colors.primaryDark} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDeleteProduct(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={16} color={THEME.colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL TAMBAH / EDIT PRODUK */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nama Menu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: Es Kopi Gula Aren"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Kategori</Text>
              <View style={styles.catSelectRow}>
                {['Makanan', 'Minuman', 'Camilan', 'Paket'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catSelectBtn,
                      category === cat && styles.catSelectBtnActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        category === cat && styles.catSelectTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Harga Jual (Rp)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="25000"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.formLabel}>Stok Tersedia</Text>
              <TextInput
                style={styles.formInput}
                placeholder="20"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveBtnText}>Simpan Menu ke Database</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  miniAlertBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniAlertBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  miniDangerBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniDangerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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
  categoryWrap: {
    marginVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  catPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  menuCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  menuCardInfo: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  menuName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  stockBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stockSafe: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stockWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stockEmpty: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockTextSafe: {
    color: '#059669',
  },
  stockTextWarning: {
    color: '#D97706',
  },
  stockTextEmpty: {
    color: '#DC2626',
  },
  stockFilterWrap: {
    marginBottom: 6,
  },
  stockFilterList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  stockFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  stockFilterBtnActive: {
    backgroundColor: THEME.colors.textPrimary,
    borderColor: THEME.colors.textPrimary,
  },
  stockFilterBtnLow: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  stockFilterBtnLowActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  stockFilterBtnEmpty: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  stockFilterBtnEmptyActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  stockFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  stockFilterTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  resetFilterBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: THEME.colors.primaryMuted,
    borderRadius: 8,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  menuCat: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  menuActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnEdit: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: THEME.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDelete: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  catSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: THEME.colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catSelectBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  catSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  catSelectTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
