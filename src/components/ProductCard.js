// Komponen ProductCard - Kartu Produk POS dengan Kontrol Jumlah & Stok

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../constants/theme';

export default function ProductCard({
  product,
  cartQuantity = 0,
  onAddToCart,
  onDecreaseQuantity,
  onAddNote,
}) {
  const isOutOfStock = !product.isAvailable || product.stock <= 0;

  return (
    <View style={[styles.card, isOutOfStock && styles.cardDisabled]}>
      {/* Header Kartu: Kategori & Ikon */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{product.category}</Text>
        </View>
        <View style={styles.iconCircle}>
          <Ionicons
            name={product.icon || 'fast-food-outline'}
            size={18}
            color={isOutOfStock ? THEME.colors.textMuted : THEME.colors.primary}
          />
        </View>
      </View>

      {/* Info Produk */}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      
      {product.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
      ) : null}

      {/* Harga & Sisa Stok */}
      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{formatRupiah(product.price)}</Text>
        <Text
          style={[
            styles.stockText,
            product.stock <= 5 && !isOutOfStock && styles.stockWarning,
            isOutOfStock && styles.stockDanger,
          ]}
        >
          {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
        </Text>
      </View>

      {/* Tombol Aksi / Kontrol Kuantitas */}
      <View style={styles.actionRow}>
        {isOutOfStock ? (
          <View style={styles.outOfStockBtn}>
            <Text style={styles.outOfStockText}>Stok Kosong</Text>
          </View>
        ) : cartQuantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddToCart(product)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControlContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => onDecreaseQuantity(product)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={THEME.colors.primaryDark} />
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyText}>{cartQuantity}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.qtyBtn,
                cartQuantity >= product.stock && styles.qtyBtnDisabled,
              ]}
              disabled={cartQuantity >= product.stock}
              onPress={() => onAddToCart(product)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={16}
                color={
                  cartQuantity >= product.stock
                    ? THEME.colors.textMuted
                    : THEME.colors.primaryDark
                }
              />
            </TouchableOpacity>

            {onAddNote && (
              <TouchableOpacity
                style={styles.noteBtn}
                onPress={() => onAddNote(product)}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={14} color={THEME.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
    flex: 1,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 14,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  stockWarning: {
    color: THEME.colors.warning,
    fontWeight: '700',
  },
  stockDanger: {
    color: THEME.colors.danger,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 6,
  },
  addButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  outOfStockBtn: {
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
  },
  outOfStockText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  qtyControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.primaryMuted,
    borderRadius: THEME.radius.md,
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.sm,
  },
  qtyBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  qtyDisplay: {
    paddingHorizontal: 8,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  noteBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
