// Layanan Riwayat Transaksi & Ringkasan Omset Keuangan KasirKu

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah, formatDateTime } from '../constants/theme';
import ReceiptModal from '../components/ReceiptModal';
import { storage } from '../services/storage';

export default function RiwayatScreen({ storeInfo }) {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Semua'); // 'Semua' | 'TUNAI' | 'QRIS'
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await storage.getTransactions();
    setTransactions(data);
  };

  // Ringkasan Finansial
  const totalOmset = transactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalCash = transactions
    .filter((t) => t.paymentMethod === 'TUNAI')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalQris = transactions
    .filter((t) => t.paymentMethod === 'QRIS')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);

  // Filter Data
  const filtered = transactions.filter((t) => {
    const matchMethod =
      filterMethod === 'Semua' || t.paymentMethod === filterMethod;
    const matchSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName &&
        t.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchMethod && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* KARTU STATISTIK OMSET KEUANGAN */}
      <View style={styles.metricsWrapper}>
        <View style={styles.mainMetricCard}>
          <Text style={styles.mainMetricLabel}>Total Omset Penjualan</Text>
          <Text style={styles.mainMetricValue}>{formatRupiah(totalOmset)}</Text>
          <View style={styles.mainMetricSub}>
            <Ionicons name="receipt-outline" size={14} color="#CCFBF1" />
            <Text style={styles.mainMetricSubText}>
              {transactions.length} Total Transaksi Berhasil
            </Text>
          </View>
        </View>

        <View style={styles.subMetricsRow}>
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricHeader}>
              <Ionicons name="cash-outline" size={16} color={THEME.colors.primary} />
              <Text style={styles.subMetricLabel}>Tunai (Cash)</Text>
            </View>
            <Text style={styles.subMetricValue}>{formatRupiah(totalCash)}</Text>
          </View>

          <View style={styles.subMetricCard}>
            <View style={styles.subMetricHeader}>
              <Ionicons name="qr-code-outline" size={16} color={THEME.colors.info} />
              <Text style={styles.subMetricLabel}>QRIS / Digital</Text>
            </View>
            <Text style={[styles.subMetricValue, { color: THEME.colors.info }]}>
              {formatRupiah(totalQris)}
            </Text>
          </View>
        </View>
      </View>

      {/* FILTER METODE & CARI NOMOR NOTA */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari no. nota / nama pelanggan..."
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

        <View style={styles.filterTabs}>
          {['Semua', 'TUNAI', 'QRIS'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.filterTab,
                filterMethod === m && styles.filterTabActive,
              ]}
              onPress={() => setFilterMethod(m)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterMethod === m && styles.filterTabTextActive,
                ]}
              >
                {m === 'Semua' ? 'Semua Metode' : m === 'TUNAI' ? 'Tunai' : 'QRIS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DAFTAR TRANSAKSI */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isTunai = item.paymentMethod === 'TUNAI';
          const itemsSummary = item.items
            ? item.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
            : '-';

          return (
            <TouchableOpacity
              style={styles.txCard}
              onPress={() => setSelectedTxForReceipt(item)}
              activeOpacity={0.8}
            >
              <View style={styles.txCardHeader}>
                <View>
                  <Text style={styles.txId}>#{item.id}</Text>
                  <Text style={styles.txTime}>
                    {formatDateTime(item.date)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.methodBadge,
                    isTunai ? styles.badgeTunai : styles.badgeQris,
                  ]}
                >
                  <Ionicons
                    name={isTunai ? 'cash' : 'qr-code'}
                    size={12}
                    color={isTunai ? THEME.colors.primaryDark : THEME.colors.info}
                  />
                  <Text
                    style={[
                      styles.methodBadgeText,
                      isTunai ? styles.methodTextTunai : styles.methodTextQris,
                    ]}
                  >
                    {item.paymentMethod}
                  </Text>
                </View>
              </View>

              <Text style={styles.txCustomer}>
                Pelanggan: <Text style={styles.bold}>{item.customerName || 'Umum'}</Text>{' '}
                • Kasir: {item.cashierName || 'Kasir'}
              </Text>

              <Text style={styles.txItems} numberOfLines={2}>
                {itemsSummary}
              </Text>

              <View style={styles.txFooter}>
                <Text style={styles.viewReceiptHint}>
                  <Ionicons name="receipt-outline" size={13} color={THEME.colors.primary} /> Buka Nota Struk
                </Text>
                <Text style={styles.txGrandTotal}>
                  {formatRupiah(item.grandTotal)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={54} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
            <Text style={styles.emptyDesc}>
              Transaksi kasir yang telah diselesaikan akan tercatat rapi di sini.
            </Text>
          </View>
        }
      />

      {/* Modal Nota Digital saat kartu riwayat diklik */}
      <ReceiptModal
        visible={!!selectedTxForReceipt}
        transaction={selectedTxForReceipt}
        storeInfo={storeInfo}
        cashierName={selectedTxForReceipt?.cashierName}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  metricsWrapper: {
    padding: 16,
    gap: 10,
  },
  mainMetricCard: {
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: 16,
    padding: 16,
    ...THEME.shadows.md,
  },
  mainMetricLabel: {
    color: '#99F6E4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainMetricValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
  },
  mainMetricSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  mainMetricSubText: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '600',
  },
  subMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  subMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  subMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterTabActive: {
    backgroundColor: THEME.colors.primaryDark,
    borderColor: THEME.colors.primaryDark,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
    gap: 6,
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txId: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  txTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeTunai: {
    backgroundColor: THEME.colors.primaryMuted,
  },
  badgeQris: {
    backgroundColor: THEME.colors.infoLight,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  methodTextTunai: {
    color: THEME.colors.primaryDark,
  },
  methodTextQris: {
    color: THEME.colors.info,
  },
  txCustomer: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  txItems: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  viewReceiptHint: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  txGrandTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
