// Layanan Manajemen Menu & Katalog Harga Produk

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../constants/theme';
import { MENU_CATEGORIES, INITIAL_PRODUCTS } from '../constants/initialData';
import { storage } from '../services/storage';

export default function MenuScreen({ products, onRefreshProducts }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal Form Tambah / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');

  // Filter
  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchName;
  });

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

  const openEditModal = (item) => {
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

    const numPrice = Number(price.replace(/\D/g, '')) || 0;
    const numCost = Number(cost.replace(/\D/g, '')) || 0;
    const numStock = Number(stock.replace(/\D/g, '')) || 0;

    if (numPrice <= 0) {
      Alert.alert('Perhatian', 'Harga jual harus lebih besar dari 0.');
      return;
    }

    if (editingProduct) {
      const updated = {
        ...editingProduct,
        name: name.trim(),
        category,
        price: numPrice,
        cost: numCost,
        stock: numStock,
        description: description.trim(),
        isAvailable: numStock > 0 ? editingProduct.isAvailable : false,
      };
      await storage.updateProduct(updated);
    } else {
      const newProd = {
        name: name.trim(),
        category,
        price: numPrice,
        cost: numCost,
        stock: numStock,
        description: description.trim(),
        icon:
          category === 'Minuman'
            ? 'cafe-outline'
            : category === 'Makanan'
            ? 'restaurant-outline'
            : category === 'Snack'
            ? 'fast-food-outline'
            : 'gift-outline',
      };
      await storage.addProduct(newProd);
    }

    setModalVisible(false);
    await onRefreshProducts();
  };

  const handleToggleAvailability = async (item) => {
    const updated = {
      ...item,
      isAvailable: !item.isAvailable,
    };
    await storage.updateProduct(updated);
    await onRefreshProducts();
  };

  const handleDeleteProduct = (item) => {
    Alert.alert(
      'Hapus Menu',
      `Apakah Anda yakin ingin menghapus "${item.name}" dari katalog?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await storage.deleteProduct(item.id);
            await onRefreshProducts();
          },
        },
      ]
    );
  };

  const handleResetCatalog = () => {
    Alert.alert(
      'Reset Katalog ke Default',
      'Katalog produk akan dikembalikan ke daftar menu standar bawaan. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await storage.saveProducts(INITIAL_PRODUCTS);
            await onRefreshProducts();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header: Total Menu & Tambah Menu Button */}
      <View style={styles.topActionRow}>
        <View>
          <Text style={styles.headerTitle}>Katalog & Harga Menu</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} menu terdaftar di sistem
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetCatalog}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Tambah Menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari menu berdasarkan nama..."
          placeholderTextColor={THEME.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {MENU_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              selectedCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === cat && styles.categoryPillTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Daftar Produk */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const profit = item.price - (item.cost || 0);
          return (
            <View style={styles.menuCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.menuIconBox}>
                    <Ionicons
                      name={item.icon || 'fast-food-outline'}
                      size={20}
                      color={THEME.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuCategory}>{item.category}</Text>
                  </View>
                </View>

                {/* Switch Ketersediaan Menu */}
                <View style={styles.statusToggleBox}>
                  <Text
                    style={[
                      styles.statusToggleLabel,
                      {
                        color: item.isAvailable
                          ? THEME.colors.successDark
                          : THEME.colors.danger,
                      },
                    ]}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => handleToggleAvailability(item)}
                    trackColor={{
                      false: '#CBD5E1',
                      true: THEME.colors.primaryLight,
                    }}
                    thumbColor={
                      item.isAvailable ? THEME.colors.primary : '#94A3B8'
                    }
                  />
                </View>
              </View>

              {item.description ? (
                <Text style={styles.menuDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {/* Detail Harga & Margin Finansial */}
              <View style={styles.priceGrid}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceItemLabel}>Harga Jual</Text>
                  <Text style={styles.priceItemValue}>
                    {formatRupiah(item.price)}
                  </Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceItemLabel}>Harga Modal</Text>
                  <Text style={styles.priceItemValue}>
                    {item.cost ? formatRupiah(item.cost) : '-'}
                  </Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceItemLabel}>Estimasi Margin</Text>
                  <Text
                    style={[
                      styles.priceItemValue,
                      { color: THEME.colors.successDark },
                    ]}
                  >
                    {profit > 0 ? `+${formatRupiah(profit)}` : '-'}
                  </Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceItemLabel}>Sisa Stok</Text>
                  <Text
                    style={[
                      styles.priceItemValue,
                      item.stock <= 5 && { color: THEME.colors.danger },
                    ]}
                  >
                    {item.stock} porsi
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Edit & Hapus */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={15} color={THEME.colors.primaryDark} />
                  <Text style={styles.editBtnText}>Edit Menu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(item)}
                >
                  <Ionicons name="trash-outline" size={15} color={THEME.colors.danger} />
                  <Text style={styles.deleteBtnText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Menu</Text>
            <Text style={styles.emptyDesc}>
              Silakan tambahkan menu baru melalui tombol "Tambah Menu" di atas.
            </Text>
          </View>
        }
      />

      {/* Modal Tambah / Edit Menu */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Data Menu' : 'Tambah Menu Baru'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Menu *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Es Kopi Susu Aren"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori Menu</Text>
                <View style={styles.categoryRadioRow}>
                  {['Makanan', 'Minuman', 'Snack', 'Paket'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catRadioBtn,
                        category === cat && styles.catRadioBtnActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catRadioText,
                          category === cat && styles.catRadioTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Harga Jual (Rp) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="25000"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Harga Modal (Rp)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="12000"
                    keyboardType="numeric"
                    value={cost}
                    onChangeText={setCost}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Jumlah Stok</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="30"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deskripsi / Bahan Produk</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Deskripsi singkat produk untuk kasir..."
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProduct}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </Text>
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
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
    ...THEME.shadows.sm,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.primaryDark,
    borderColor: THEME.colors.primaryDark,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  menuCategory: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statusToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusToggleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  menuDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginVertical: 8,
    lineHeight: 16,
  },
  priceGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceItemLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  priceItemValue: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dangerDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },

  // Modal Form
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalBody: {
    maxHeight: 440,
  },
  modalBodyContent: {
    padding: 20,
    gap: 14,
  },
  formGroup: {},
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  formTextarea: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryRadioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catRadioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catRadioBtnActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  catRadioText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  catRadioTextActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '800',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
