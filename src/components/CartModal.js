// Drawer / Modal Keranjang Belanja KasirKu
// loop

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../constants/theme';

export default function CartModal({
  visible,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onClearCart,
  onProceedPayment,
  discountPercent = 0,
  onSelectDiscount,
}) {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const startEditNote = (item) => {
    setEditingNoteId(item.id);
    setTempNote(item.note || '');
  };

  const saveNote = (itemId) => {
    onUpdateNote(itemId, tempNote.trim());
    setEditingNoteId(null);
    setTempNote('');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Kosongkan Keranjang',
      'Apakah Anda yakin ingin menghapus seluruh pesanan dari keranjang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kosongkan',
          style: 'destructive',
          onPress: onClearCart,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Drawer */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="cart" size={20} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Keranjang Pesanan</Text>
                <Text style={styles.subtitle}>{totalItems} item dipilih</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {cart.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearCart}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={THEME.colors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Isi Keranjang */}
          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={60} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>Keranjang Masih Kosong</Text>
              <Text style={styles.emptyText}>
                Silakan pilih produk dari katalog menu untuk menambahkan pesanan.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.itemList}
              contentContainerStyle={styles.itemListContent}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item.id} style={styles.cartCard}>
                  <View style={styles.cardMainRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemUnitPrice}>
                        {formatRupiah(item.price)} / porsi
                      </Text>
                    </View>

                    {/* Kontrol Qty */}
                    <View style={styles.qtyBox}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons
                          name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                          size={16}
                          color={item.quantity === 1 ? THEME.colors.danger : THEME.colors.primaryDark}
                        />
                      </TouchableOpacity>

                      <Text style={styles.qtyValue}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={[
                          styles.qtyButton,
                          item.quantity >= item.stock && styles.qtyButtonDisabled,
                        ]}
                        disabled={item.quantity >= item.stock}
                        onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={
                            item.quantity >= item.stock
                              ? THEME.colors.textMuted
                              : THEME.colors.primaryDark
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemTotal}>
                      {formatRupiah(item.price * item.quantity)}
                    </Text>
                  </View>

                  {/* Catatan Item */}
                  {editingNoteId === item.id ? (
                    <View style={styles.noteInputRow}>
                      <TextInput
                        style={styles.noteInput}
                        value={tempNote}
                        onChangeText={setTempNote}
                        placeholder="Contoh: Kurang manis, Pedas level 2..."
                        placeholderTextColor={THEME.colors.textMuted}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.saveNoteBtn}
                        onPress={() => saveNote(item.id)}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelNoteBtn}
                        onPress={() => setEditingNoteId(null)}
                      >
                        <Ionicons name="close" size={16} color={THEME.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.notePreviewRow}
                      onPress={() => startEditNote(item)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color={item.note ? THEME.colors.primary : THEME.colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.notePreviewText,
                          item.note ? styles.noteFilled : styles.notePlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {item.note ? `Catatan: ${item.note}` : '+ Tambah catatan khusus'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Opsi Diskon */}
              <View style={styles.discountContainer}>
                <Text style={styles.discountLabel}>Pilih Diskon Promosi:</Text>
                <View style={styles.discountRow}>
                  {[0, 5, 10, 15].map((pct) => (
                    <TouchableOpacity
                      key={pct}
                      style={[
                        styles.discountPill,
                        discountPercent === pct && styles.discountPillActive,
                      ]}
                      onPress={() => onSelectDiscount(pct)}
                    >
                      <Text
                        style={[
                          styles.discountPillText,
                          discountPercent === pct && styles.discountPillTextActive,
                        ]}
                      >
                        {pct === 0 ? 'Normal' : `${pct}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Kalkulasi & Pembayaran */}
          {cart.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
              </View>

              {discountPercent > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: THEME.colors.danger }]}>
                    Diskon ({discountPercent}%)
                  </Text>
                  <Text style={[styles.summaryValue, { color: THEME.colors.danger }]}>
                    - {formatRupiah(discountAmount)}
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Bayar</Text>
                <Text style={styles.grandTotalValue}>{formatRupiah(grandTotal)}</Text>
              </View>

              <TouchableOpacity
                style={styles.payButton}
                onPress={() => {
                  onClose();
                  onProceedPayment({
                    cart,
                    subtotal,
                    discountPercent,
                    discountAmount,
                    grandTotal,
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.payButtonText}>Lanjutkan ke Pembayaran</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    padding: 6,
  },
  closeBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  itemList: {
    maxHeight: 340,
  },
  itemListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cartCard: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  itemUnitPrice: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 8,
  },
  qtyButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    paddingHorizontal: 6,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    minWidth: 70,
    textAlign: 'right',
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  saveNoteBtn: {
    backgroundColor: THEME.colors.primary,
    padding: 6,
    borderRadius: 6,
  },
  cancelNoteBtn: {
    padding: 6,
  },
  notePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  notePreviewText: {
    fontSize: 11,
  },
  noteFilled: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  notePlaceholder: {
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  discountContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discountPill: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  discountPillActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  discountPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  discountPillTextActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  grandTotalRow: {
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  payButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    gap: 8,
    ...THEME.shadows.md,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
